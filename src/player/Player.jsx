import { useEffect, useState } from 'react'
import { useNow, useStore, useValue } from '../net/hooks.js'
import { STREAK_MIN, WH_TYPES, normalize } from '../game/logic.js'
import { podiumStage } from '../game/podium.js'
import confetti from 'canvas-confetti'
import { Button, Center, Logo, PART_KEYS, Prompt, ROLES, RoleTag, StreakBadge, TimerBar } from '../ui.jsx'

/* sessionStorage y no localStorage: cada pestaña es un jugador distinto (útil
   para probar), y recargar la página conserva al mismo jugador. Si el celular
   cierra la pestaña, volver a entrar con el MISMO nombre recupera los puntos. */
const pidKey = (pin) => `kachai-pid-${pin}`
const saved = {
  get(k) { try { return sessionStorage.getItem(k) } catch { return null } },
  set(k, v) { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k) } catch { /* sin storage */ } },
}
const randomId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export default function Player({ initialPin }) {
  const store = useStore()
  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(Boolean(initialPin && saved.get(pidKey(initialPin))))
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!store || !checking) return
    const pid = saved.get(pidKey(initialPin))
    store.get(`rooms/${initialPin}/players/${pid}`)
      .then((p) => { if (p) setMe({ pin: initialPin, pid }) })
      .finally(() => setChecking(false))
  }, [store, checking, initialPin])

  if (!store || checking) return <Center>Loading…</Center>
  if (!me) return <JoinForm store={store} initialPin={initialPin} notice={notice} onJoined={setMe} />
  return (
    <PlayerRoom store={store} {...me}
      onLeave={(reason) => {
        saved.set(pidKey(me.pin), null)
        setNotice(reason === 'kicked' ? 'You were removed from the game.' : 'The game has ended.')
        setMe(null)
      }} />
  )
}

function JoinForm({ store, initialPin, notice, onJoined }) {
  const [pin, setPin] = useState(initialPin || '')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function join(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const p = pin.trim()
      const n = name.trim().replace(/\s+/g, ' ')
      if (!/^\d{6}$/.test(p)) throw new Error('The PIN has 6 numbers.')
      if (!n) throw new Error('Write your name.')
      if (!(await store.get(`rooms/${p}/meta`))) throw new Error('Game not found. Check the PIN.')
      const players = (await store.get(`rooms/${p}/players`)) || {}
      const online = (await store.get(`rooms/${p}/online`)) || {}
      const same = Object.entries(players).find(([, pl]) => normalize(pl.name) === normalize(n))
      let pid
      if (same) {
        // Mismo nombre y desconectado = el mismo alumno que vuelve: recupera sus puntos.
        if (online[same[0]] !== false) throw new Error('That name is taken. Try another one.')
        pid = same[0]
      } else {
        pid = randomId()
        await store.set(`rooms/${p}/players/${pid}`, { name: n, joinedAt: store.stamp() })
      }
      saved.set(pidKey(p), pid)
      onJoined({ pin: p, pid })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={join} className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 flex flex-col gap-4">
        <Logo className="text-4xl text-center" />
        {notice && <p className="rounded-xl bg-amber-50 text-amber-800 p-3 text-sm font-bold text-center">{notice}</p>}
        {!initialPin && (
          <input inputMode="numeric" maxLength={6} placeholder="Game PIN" value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-widest focus:border-[#0F6FD6] outline-none" />
        )}
        {initialPin && <p className="text-center text-slate-500">PIN <b className="text-slate-900 tracking-widest">{initialPin}</b></p>}
        <input maxLength={16} placeholder="Your name" value={name} autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-xl font-bold focus:border-[#0F6FD6] outline-none" />
        {error && <p className="text-rose-600 text-sm font-bold text-center">{error}</p>}
        <Button disabled={busy} className="text-lg">{busy ? 'Joining…' : 'Join'}</Button>
      </form>
    </div>
  )
}

function PlayerRoom({ store, pin, pid, onLeave }) {
  const base = `rooms/${pin}`
  const meta = useValue(store, `${base}/meta`)
  const state = useValue(store, `${base}/state`)
  const profile = useValue(store, `${base}/players/${pid}`)
  const score = useValue(store, `${base}/scores/${pid}`)
  const inGame = state?.qIndex != null && state.phase !== 'lobby'
  const myAnswer = useValue(store, inGame ? `${base}/answers/${state.qIndex}/${pid}` : null)
  const now = useNow(store)

  useEffect(() => store.presence(`${base}/online/${pid}`), [store, base, pid])
  useEffect(() => {
    if (meta === null) onLeave('closed')
    else if (profile === null) onLeave('kicked')
  }, [meta, profile])

  if (!meta || !state || !profile) return <Center>Connecting…</Center>

  const submit = (a) => store.set(`${base}/answers/${state.qIndex}/${pid}`, { ...a, at: store.stamp() })
  const answerMs = meta.answerSec * 1000
  const timeUp = typeof state.startedAt === 'number' && now >= state.startedAt + answerMs
  /* Suspenso: desde la última pregunta hasta que el podio termina de revelarse,
     nadie ve su total (compararlo con el de un compañero delataría el orden). */
  const lastQuestion = ['reading', 'answering', 'reveal'].includes(state.phase) && state.qIndex + 1 >= state.total
  const secretScore = lastQuestion || (state.phase === 'end' && !podiumStage(state.startedAt, now).rest)

  let body
  if (state.phase === 'lobby') {
    body = (
      <Message emoji="✅" title={`You're in, ${profile.name}!`}>
        Look at the screen. The game starts soon.
      </Message>
    )
  } else if (state.phase === 'reading') {
    body = (
      <div className="flex flex-col gap-6 pt-8">
        {state.practice && <PracticeBadge />}
        <p className="text-center font-bold uppercase tracking-widest text-slate-500 text-sm">Read carefully</p>
        <Prompt text={state.question.prompt} className="text-center text-3xl" />
        <TimerBar start={state.startedAt} ms={meta.readSec * 1000} now={now} />
      </div>
    )
  } else if (state.phase === 'answering') {
    if (myAnswer === undefined) body = <Center>…</Center>
    else if (myAnswer) {
      body = (
        <Message emoji="📨" title="Answer sent!">
          <MyChoices answer={myAnswer} />
          <span className="block mt-3">Wait for the others…</span>
        </Message>
      )
    } else if (timeUp) {
      body = <Message emoji="⏰" title="Time's up!">Be faster next time.</Message>
    } else {
      body = (
        <>
          {state.practice && <PracticeBadge />}
          <AnswerForm key={`${state.round}-${state.qIndex}`} question={state.question} mode={meta.mode}
            timer={<TimerBar start={state.startedAt} ms={answerMs} now={now} />} onSubmit={submit} />
        </>
      )
    }
  } else if (state.phase === 'reveal' && state.solution) {
    body = <Result solution={state.solution} answer={myAnswer} score={score} secret={secretScore} practice={state.practice} />
  } else if (state.phase === 'leaderboard') {
    body = (
      <Message emoji="📊" title={score?.rank ? `You are #${score.rank}` : 'Ranking'}>
        {score?.total ?? 0} points
      </Message>
    )
  } else if (state.phase === 'end') {
    // Mismo guion que el proyector: el puesto no se ve aquí antes que en la pantalla.
    body = podiumStage(state.startedAt, now).rest
      ? <FinalPosition score={score} />
      : <Message emoji="👀" title="Look at the screen!">The podium is being revealed…</Message>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
        <Logo className="text-xl" />
        <span className="flex-1 min-w-0 flex items-center justify-end gap-2">
          <span className="font-bold truncate">{profile.name}</span>
          <StreakBadge streak={score?.streak} className="text-sm shrink-0" />
        </span>
        <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-sm font-black tabular-nums"
          title={secretScore ? 'Secret until the podium' : undefined}>
          {secretScore ? '🤫' : score?.total ?? 0}
        </span>
      </header>
      <main className="flex-1 w-full max-w-md mx-auto p-4">{body}</main>
    </div>
  )
}

function FinalPosition({ score }) {
  const rank = score?.rank
  useEffect(() => {
    if (!rank || rank > 3) return
    confetti({ particleCount: rank === 1 ? 180 : 80, spread: 90, origin: { y: 0.6 }, disableForReducedMotion: true })
  }, [rank])
  const medal = ['🥇', '🥈', '🥉'][rank - 1] || '🎉'
  return (
    <Message emoji={medal} title={rank ? `Final position: #${rank}` : 'Game over'}>
      {score?.total ?? 0} points. {rank === 1 ? 'You are the champion! 👑' : 'Well done!'}
    </Message>
  )
}

function PracticeBadge() {
  return (
    <p className="self-center mx-auto mb-3 w-fit rounded-full bg-violet-100 text-violet-800 text-xs font-black uppercase tracking-widest px-3 py-1">
      Practice · no points
    </p>
  )
}

function Message({ emoji, title, children }) {
  return (
    <div className="pt-16 flex flex-col items-center text-center gap-3">
      <span className="text-6xl">{emoji}</span>
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="text-slate-600">{children}</div>
    </div>
  )
}

const HINTS = {
  subject: 'Who or what is the answer about?',
  verb: 'The verb with its tense',
  wh: 'What kind of information?',
}

function AnswerForm({ question, mode, timer, onSubmit }) {
  const [answer, setAnswer] = useState({ subject: '', verb: '', wh: '' })
  const [sending, setSending] = useState(false)
  const pick = (part, value) => setAnswer((a) => ({ ...a, [part]: value }))
  const ready = answer.subject.trim() && answer.verb.trim() && answer.wh

  async function send(e) {
    e.preventDefault()
    if (!ready || sending) return
    setSending(true)
    await onSubmit({ subject: answer.subject.trim(), verb: answer.verb.trim(), wh: answer.wh })
  }

  const options = {
    subject: question.subjectOptions,
    verb: question.verbOptions,
    wh: question.whOptions,
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-4">
      <div className="sticky top-0 bg-slate-50 pt-1 pb-2 flex flex-col gap-2 z-10">
        <Prompt text={question.prompt} className="text-xl text-center" />
        {timer}
      </div>
      {PART_KEYS.map((part) => {
        const r = ROLES[part]
        const typed = mode === 'write' && part !== 'wh'
        return (
          <fieldset key={part} className={`rounded-2xl border-l-4 bg-white p-3 ${r.border}`}>
            <legend className="sr-only">{r.label}</legend>
            <div className="flex items-center gap-2 mb-2">
              <RoleTag part={part} />
              <span className="text-xs text-slate-500">{HINTS[part]}</span>
            </div>
            {typed ? (
              <input value={answer[part]} onChange={(e) => pick(part, e.target.value)}
                autoCapitalize="off" autoCorrect="off" spellCheck={false} maxLength={40}
                placeholder={part === 'subject' ? 'e.g. He' : 'e.g. played'}
                className={`w-full rounded-xl border-2 px-3 py-2 text-lg font-bold outline-none border-slate-200 focus:border-slate-500`} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {options[part].map((opt) => {
                  const on = answer[part] === opt
                  return (
                    <button type="button" key={opt} onClick={() => pick(part, opt)}
                      className={`rounded-xl border-2 px-2 py-3 font-bold transition active:scale-95 ${on ? `${r.solid} text-white` : `bg-white ${r.border} ${r.text}`}`}>
                      {part === 'wh' ? WH_TYPES[opt] : opt}
                    </button>
                  )
                })}
              </div>
            )}
          </fieldset>
        )
      })}
      <Button disabled={!ready || sending} className="text-lg py-4 sticky bottom-3 shadow-lg">
        {sending ? 'Sending…' : 'Send answer'}
      </Button>
    </form>
  )
}

function MyChoices({ answer }) {
  return (
    <span className="flex flex-wrap justify-center gap-2">
      {PART_KEYS.map((k) => (
        <span key={k} className={`rounded-lg px-2 py-1 font-bold text-white ${ROLES[k].solid}`}>
          {k === 'wh' ? WH_TYPES[answer.wh] : answer[k]}
        </span>
      ))}
    </span>
  )
}

function Result({ solution, answer, score, secret, practice }) {
  const parts = score?.parts || [false, false, false]
  const correct = { subject: solution.subject.join(' / '), verb: solution.verb.join(' / '), wh: WH_TYPES[solution.wh] }
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="text-center">
        <p className="text-5xl">{!answer ? '😶' : parts.every(Boolean) ? '🎉' : parts.some(Boolean) ? '👍' : '💪'}</p>
        {secret
          ? <p className="text-lg font-bold mt-2 text-slate-600">Points are secret until the podium 🤫</p>
          : <p className="text-3xl font-black mt-2">+{score?.gain ?? 0}</p>}
        {practice && (
          <p className="text-violet-700 font-bold">Practice: these points don’t count. The real game starts at 0!</p>
        )}
        {score?.streak >= STREAK_MIN && (
          <p className="mt-2 text-xl font-black text-orange-600">🔥 {score.streak} in a row!</p>
        )}
        {!answer && <p className="text-slate-500">No answer this time.</p>}
      </div>
      {PART_KEYS.map((k, i) => (
        <div key={k} className={`rounded-2xl border-2 p-3 bg-white ${parts[i] ? 'border-green-500' : 'border-rose-300'}`}>
          <div className="flex items-center gap-2">
            <RoleTag part={k} />
            <span className="ml-auto text-xl">{parts[i] ? '✅' : '❌'}</span>
          </div>
          {answer && !parts[i] && (
            <p className="mt-2 text-slate-500 line-through">{k === 'wh' ? WH_TYPES[answer.wh] : answer[k]}</p>
          )}
          <p className={`mt-1 text-lg font-black ${ROLES[k].text}`}>{correct[k]}</p>
        </div>
      ))}
      {solution.example && (
        <p className="text-center text-slate-600">
          Possible answer: <i className="text-slate-900">“{solution.example}”</i>
        </p>
      )}
    </div>
  )
}
