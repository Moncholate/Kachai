import { useEffect, useState } from 'react'
import { useNow, useStore, useValue } from '../net/hooks.js'
import { STREAK_MIN, WH_TYPES, historyKey, isChoice, normalize } from '../game/logic.js'
import { normalizeQuestion } from '../game/library.js'
import { podiumStage } from '../game/podium.js'
import { TEAM_MAX, membersOf, mvpOf, presetOf, teamIdsOf, teamRanking } from '../game/teams.js'
import confetti from 'canvas-confetti'
import { Button, CHOICE_STYLES, Center, Logo, PART_KEYS, Prompt, ROLES, RoleTag, StreakBadge, TimerBar, choiceCols } from '../ui.jsx'

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
  /* En equipos el celular necesita a todos: para elegir equipo (cupos), ver a
     sus compañeros y calcular el puesto del equipo. En individual, no. */
  const teamMode = meta?.teamMode === 'teams'
  const players = useValue(store, teamMode ? `${base}/players` : null) || {}
  const scores = useValue(store, teamMode ? `${base}/scores` : null) || {}
  const now = useNow(store)
  /* El resumen del último juego queda en el celular aunque el profesor vuelva al
     lobby ("Jugar otra vez" borra puntajes y respuestas de la sala). */
  const [lastGame, setLastGame] = useState(null)
  useEffect(() => {
    if (state?.phase === 'end' && state.review && score?.history) setLastGame({ review: state.review, history: score.history })
  }, [state?.phase, state?.review, score?.history])

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

  const teams = meta.teams || {}
  const myTeam = teamMode && teams[profile.team] ? { id: profile.team, ...teams[profile.team] } : null
  const teamRank = teamMode ? teamRanking(teams, players, scores) : []
  const myTeamPlace = myTeam ? teamRank.findIndex((t) => t.id === myTeam.id) + 1 : 0

  let body
  if (state.phase === 'lobby') {
    const waiting = teamMode
      ? <TeamLobby profile={profile} pid={pid} meta={meta} players={players}
          onPick={(team) => store.update(`${base}/players/${pid}`, { team })} />
      : (
        <Message emoji="✅" title={`You're in, ${profile.name}!`}>
          Look at the screen. The game starts soon.
        </Message>
      )
    body = lastGame
      ? <EndTabs review={lastGame.review} history={lastGame.history} firstLabel="⏳ Next game">{waiting}</EndTabs>
      : waiting
  } else if (state.phase === 'reading') {
    body = (
      <div className="flex flex-col gap-6 pt-8">
        {state.practice && <PracticeBadge />}
        {state.question.hasImage && <LookAtScreen />}
        <p className="text-center font-bold uppercase tracking-widest text-slate-500 text-sm">Read carefully</p>
        <Prompt text={state.question.prompt} highlightWh={state.question.kind !== 'choice'} className="text-center text-3xl" />
        <TimerBar start={state.startedAt} ms={meta.readSec * 1000} now={now} />
      </div>
    )
  } else if (state.phase === 'answering') {
    if (myAnswer === undefined) body = <Center>…</Center>
    else if (myAnswer) {
      body = (
        <Message emoji="📨" title="Answer sent!">
          <MyChoices answer={myAnswer} options={state.question.options} />
          <span className="block mt-3">Wait for the others…</span>
        </Message>
      )
    } else if (timeUp) {
      body = <Message emoji="⏰" title="Time's up!">Be faster next time.</Message>
    } else {
      body = (
        <>
          {state.practice && <PracticeBadge />}
          {state.question.hasImage && <LookAtScreen />}
          {state.question.kind === 'choice'
            ? <ChoiceForm key={`${state.round}-${state.qIndex}`} question={state.question}
                timer={<TimerBar start={state.startedAt} ms={answerMs} now={now} />} onSubmit={submit} />
            : <AnswerForm key={`${state.round}-${state.qIndex}`} question={state.question} mode={meta.mode}
                timer={<TimerBar start={state.startedAt} ms={answerMs} now={now} />} onSubmit={submit} />}
        </>
      )
    }
  } else if (state.phase === 'reveal' && state.solution) {
    body = state.question.kind === 'choice'
      ? <ChoiceResult question={state.question} solution={state.solution} answer={myAnswer} score={score} secret={secretScore} practice={state.practice} />
      : <Result solution={state.solution} answer={myAnswer} score={score} secret={secretScore} practice={state.practice} />
  } else if (state.phase === 'leaderboard' && myTeam) {
    body = (
      <Message emoji={myTeam.emoji} title={myTeamPlace ? `Your team is #${myTeamPlace}` : 'Ranking'}>
        {myTeam.name}: {teamRank[myTeamPlace - 1]?.total ?? 0} points (team average)
        <span className="block mt-1 text-sm">You: {score?.total ?? 0} points</span>
        <DuelNote board={state.board} id={myTeam.id} team />
      </Message>
    )
  } else if (state.phase === 'leaderboard') {
    body = (
      <Message emoji="📊" title={score?.rank ? `You are #${score.rank}` : 'Ranking'}>
        {score?.total ?? 0} points
        <DuelNote board={state.board} id={pid} />
      </Message>
    )
  } else if (state.phase === 'end') {
    // Mismo guion que el proyector: el puesto no se ve aquí antes que en la pantalla.
    body = podiumStage(state.startedAt, now).rest
      ? (
        <EndTabs review={state.review} history={score?.history}>
          {myTeam
            ? <TeamFinalPosition team={myTeam} place={myTeamPlace} total={teamRank[myTeamPlace - 1]?.total ?? 0}
                mvp={mvpOf(players, scores)?.id === pid} />
            : <FinalPosition score={score} />}
        </EndTabs>
      )
      : <Message emoji="👀" title="Look at the screen!">The podium is being revealed…</Message>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
        <Logo className="text-xl" />
        <span className="flex-1 min-w-0 flex items-center justify-end gap-2">
          {myTeam && <span title={myTeam.name} className="text-xl shrink-0">{myTeam.emoji}</span>}
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

/* Lobby en modo equipos: "ellos eligen" muestra los equipos para tocar uno
   (con cupo de TEAM_MAX); "al azar" espera a que el profesor reparta. */
function TeamLobby({ profile, pid, meta, players, onPick }) {
  const teams = meta.teams || {}
  const ids = teamIdsOf(teams)
  const mine = teams[profile.team] ? profile.team : null
  const mates = mine ? membersOf(mine, players).filter((id) => id !== pid).map((id) => players[id].name) : []

  if (meta.teamPick !== 'choose') {
    return mine
      ? (
        <Message emoji={teams[mine].emoji} title={`You’re in the ${teams[mine].name}!`}>
          {mates.length ? <>With {mates.join(', ')}.</> : 'Wait for your teammates.'}
          <span className="block mt-2">Look at the screen. The game starts soon.</span>
        </Message>
      )
      : (
        <Message emoji="🎲" title={`You're in, ${profile.name}!`}>
          The teacher is making the teams. Look at the screen.
        </Message>
      )
  }

  return (
    <div className="flex flex-col gap-3 pt-6">
      <h2 className="text-2xl font-black text-center">{mine ? 'Your team' : 'Choose your team'}</h2>
      {ids.map((t) => {
        const count = membersOf(t, players).length
        const full = count >= TEAM_MAX && t !== mine
        const st = presetOf(t)
        return (
          <button key={t} onClick={() => onPick(t)} disabled={full}
            className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-95 disabled:opacity-40 ${st.border} ${t === mine ? `${st.solid} text-white` : st.tint}`}>
            <span className="text-3xl">{teams[t].emoji}</span>
            <span className="flex-1 text-lg font-black">{teams[t].name}</span>
            <span className="text-sm font-bold tabular-nums">{full ? 'Full' : `${count} / ${TEAM_MAX}`}</span>
          </button>
        )
      })}
      {mine && (
        <p className="text-center text-slate-600">
          {mates.length ? <>With {mates.join(', ')}. </> : null}You can still change. Look at the screen.
        </p>
      )}
    </div>
  )
}

/* El duelo personal en el ranking (ver game/duels.js): adelantamientos de esta
   pregunta y el rival a tiro para la próxima. team: frases para el equipo. */
function DuelNote({ board, id, team = false }) {
  const overtakes = board?.overtakes ? Object.values(board.overtakes) : []
  const passed = overtakes.find((o) => o.who.id === id)
  const lost = overtakes.find((o) => o.over.id === id)
  const duel = board?.personal?.[id]
  const we = team ? 'Your team' : 'You'
  if (!passed && !lost && !duel) return null
  return (
    <span className="mt-4 flex flex-col gap-2">
      {passed && <span className="rounded-2xl bg-violet-600 text-white font-black px-4 py-2">🔄 {we} overtook {passed.over.name}!</span>}
      {lost && <span className="rounded-2xl bg-slate-700 text-white font-black px-4 py-2">😮 {lost.who.name} overtook {team ? 'your team' : 'you'}!</span>}
      {duel && (
        <span className={`rounded-2xl border-2 font-black px-4 py-2 ${duel.gap < 100 ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-orange-400 bg-orange-50 text-orange-700'}`}>
          {duel.gap === 0
            ? `⚔️ ${we} ${team ? 'is' : 'are'} tied with ${duel.rival}!`
            : duel.ahead
              ? `⚔️ ${we} ${team ? 'is' : 'are'} ${duel.gap} pts behind ${duel.rival}. Catch up!`
              : `⚔️ ${duel.rival} is ${duel.gap} pts behind ${team ? 'your team' : 'you'}. Defend your place!`}
        </span>
      )}
    </span>
  )
}

function TeamFinalPosition({ team, place, total, mvp }) {
  useEffect(() => {
    if (!mvp && (!place || place > 3)) return
    confetti({ particleCount: place === 1 || mvp ? 180 : 80, spread: 90, origin: { y: 0.6 }, disableForReducedMotion: true })
  }, [place, mvp])
  const medal = ['🥇', '🥈', '🥉'][place - 1] || team.emoji
  return (
    <Message emoji={medal} title={place ? `${team.emoji} ${team.name}: #${place}` : 'Game over'}>
      {total} points (team average). {place === 1 ? 'Champions! 👑' : 'Well done, team!'}
      {mvp && <span className="block mt-3 text-xl font-black text-amber-600">⭐ You’re the MVP!</span>}
    </Message>
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

/* Al terminar: el puesto, y una pestaña de repaso con cada pregunta. */
function EndTabs({ review, history, firstLabel = '🏆 Result', children }) {
  const [tab, setTab] = useState('result')
  const questions = review
    ? (Array.isArray(review) ? review : Object.values(review)).map((q) => ({ ...normalizeQuestion(q), hasImage: q.hasImage }))
    : []
  return (
    <div className="flex flex-col gap-4 pt-2">
      {questions.length > 0 && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {[['result', firstLabel], ['review', '📋 Review my answers']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`rounded-lg py-2 text-sm font-bold transition ${tab === id ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      {tab === 'review' && questions.length > 0 ? <Review questions={questions} history={history} /> : (
        <>
          {children}
          {questions.length > 0 && (
            <Button className="text-lg py-4 mt-2" onClick={() => setTab('review')}>📋 See your answers</Button>
          )}
        </>
      )}
    </div>
  )
}

function Review({ questions, history }) {
  const rows = questions.map((q, i) => ({ q, h: history?.[historyKey(i)] }))
  const right = rows.filter(({ h }) => h?.parts?.every(Boolean)).length
  const points = rows.reduce((sum, { h }) => sum + (h?.gain || 0), 0)
  return (
    <div className="flex flex-col gap-3 pb-6">
      <p className="text-center">
        <span className="text-2xl font-black">{right} / {rows.length}</span>
        <span className="text-slate-500"> fully correct · {points} points</span>
      </p>
      {rows.map(({ q, h }, i) => <ReviewItem key={i} n={i + 1} q={q} h={h} />)}
    </div>
  )
}

function ReviewItem({ n, q, h }) {
  const parts = h?.parts ? (Array.isArray(h.parts) ? h.parts : Object.values(h.parts)) : []
  const all = parts.length > 0 && parts.every(Boolean)
  const some = parts.some(Boolean)
  const a = h?.answer
  const tone = !a ? 'border-slate-300' : all ? 'border-green-500' : some ? 'border-amber-400' : 'border-rose-300'
  return (
    <article className={`rounded-2xl border-2 bg-white p-3 flex flex-col gap-2 ${tone}`}>
      <div className="flex items-start gap-2">
        <span className="font-black text-slate-400">{n}</span>
        <Prompt text={q.prompt} highlightWh={!isChoice(q)} className="flex-1 text-base" />
        <span className="text-xl">{!a ? '😶' : all ? '✅' : some ? '🟡' : '❌'}</span>
      </div>
      {q.hasImage && <p className="text-xs text-slate-500">📷 This question had a picture on the screen.</p>}
      {!a && <p className="text-sm text-slate-500">No answer.</p>}
      {isChoice(q) ? (
        <div className="text-sm flex flex-col gap-1">
          {a && <p className={`font-bold ${all ? 'text-green-700' : 'text-rose-600'}`}>{all ? '✓' : '✗'} You: {a.choice}</p>}
          {!all && <p className="font-bold text-green-700">✓ Correct: {q.answer}</p>}
        </div>
      ) : (
        <div className="text-sm flex flex-col gap-1">
          {PART_KEYS.map((k, i) => {
            const correct = k === 'wh' ? WH_TYPES[q.wh] : q[k].accept.join(' / ')
            const given = a && (k === 'wh' ? WH_TYPES[a.wh] : a[k])
            return (
              <p key={k} className="flex flex-wrap items-center gap-1.5">
                <RoleTag part={k} />
                {a && parts[i] ? <b className={ROLES[k].text}>{given} ✓</b> : (
                  <>
                    {given && <s className="text-slate-400">{given}</s>}
                    <b className={ROLES[k].text}>{correct}</b>
                  </>
                )}
              </p>
            )
          })}
          {q.example && <p className="text-slate-500">Possible answer: <i className="text-slate-800">“{q.example}”</i></p>}
        </div>
      )}
      {h?.gain > 0 && <p className="text-right text-sm font-black text-slate-600">+{h.gain}</p>}
    </article>
  )
}

/* La imagen de la pregunta se ve solo en el proyector. */
function LookAtScreen() {
  return (
    <p className="self-center mx-auto mb-3 w-fit rounded-full bg-sky-100 text-sky-800 text-sm font-black px-3 py-1">
      👀 Look at the picture on the screen
    </p>
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

/* Opción múltiple: tocar una alternativa ya es responder, como en Kahoot. */
function ChoiceForm({ question, timer, onSubmit }) {
  const [sent, setSent] = useState(null)
  const choose = (choice) => {
    if (sent) return
    setSent(choice)
    onSubmit({ choice })
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Prompt text={question.prompt} highlightWh={false} className="text-xl text-center" />
        {timer}
      </div>
      <div className={`grid ${choiceCols(question.options)} gap-3`}>
        {question.options.map((o, i) => {
          const st = CHOICE_STYLES[i]
          return (
            <button type="button" key={o} onClick={() => choose(o)} disabled={Boolean(sent)}
              className={`min-h-[6rem] rounded-2xl px-3 py-4 flex items-center gap-3 text-left text-white text-lg font-bold transition active:scale-95 ${st.solid} ${sent && sent !== o ? 'opacity-40' : ''}`}>
              <span className="text-2xl shrink-0">{st.shape}</span>
              <span className="flex-1">{o}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* Resultado en opción múltiple. En clase los alumnos se guiaban por el color de
   la alternativa: si la correcta salía grande y con SU color, creían haberla
   elegido. Por eso: veredicto grande arriba, "Your answer" con el color que
   tocaron, y la correcta aparte y siempre en verde. */
function ChoiceResult({ question, solution, answer, score, secret, practice }) {
  const right = Boolean(score?.parts?.[0])
  const mine = answer ? question.options.indexOf(answer.choice) : -1
  const correct = question.options.indexOf(solution.answer)
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Verdict status={!answer ? 'none' : right ? 'right' : 'wrong'} score={score} secret={secret} practice={practice} />
      <Prompt text={question.prompt} highlightWh={false} className="text-lg text-center" />
      {answer && mine >= 0 && (
        <AnswerTile label="Your answer" right={right}
          className={`${CHOICE_STYLES[mine].solid} text-white`} shape={CHOICE_STYLES[mine].shape} text={answer.choice} />
      )}
      {!right && (
        <AnswerTile label="Correct answer" right
          className="bg-green-50 text-green-800 border-2 border-green-500" shape={CHOICE_STYLES[correct]?.shape} text={solution.answer} />
      )}
    </div>
  )
}

/* Veredicto a todo lo ancho: lo primero que se ve, sin depender de colores de alternativas. */
function Verdict({ status, score, secret, practice, detail }) {
  const look = {
    right: ['bg-green-600', '✅', 'Correct!'],
    partial: ['bg-amber-500', '🟡', 'Almost!'],
    wrong: ['bg-rose-600', '❌', 'Incorrect'],
    none: ['bg-slate-500', '😶', 'No answer'],
  }[status]
  return (
    <div className={`rounded-3xl ${look[0]} text-white text-center px-4 py-4 shadow`}>
      <p className="text-3xl font-black">{look[1]} {look[2]}</p>
      {detail && <p className="font-bold opacity-90">{detail}</p>}
      {secret
        ? <p className="mt-1 font-bold opacity-90">Points are secret until the podium 🤫</p>
        : <p className="mt-1 text-2xl font-black">+{score?.gain ?? 0}</p>}
      {practice && <p className="mt-1 text-sm font-bold opacity-90">Practice: these points don’t count.</p>}
      {score?.streak >= STREAK_MIN && <p className="mt-1 text-lg font-black">🔥 {score.streak} in a row!</p>}
    </div>
  )
}

function AnswerTile({ label, right, className, shape, text }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <div className={`relative rounded-2xl px-4 py-3 flex items-center gap-3 text-lg font-black ${className}`}>
        {shape && <span className="text-2xl">{shape}</span>}
        <span className="flex-1">{text}</span>
        <span className={`grid place-items-center w-9 h-9 rounded-full text-xl font-black shrink-0 ${right ? 'bg-green-600 text-white' : 'bg-white text-rose-600 ring-4 ring-rose-600'}`}>
          {right ? '✓' : '✗'}
        </span>
      </div>
    </div>
  )
}

function MyChoices({ answer, options }) {
  if (answer.choice != null) {
    const st = CHOICE_STYLES[options?.indexOf(answer.choice)]
    return (
      <span className={`inline-block rounded-lg px-3 py-1 font-bold text-white ${st?.solid ?? 'bg-slate-700'}`}>
        {st?.shape} {answer.choice}
      </span>
    )
  }
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
  const hits = parts.filter(Boolean).length
  const status = !answer ? 'none' : hits === 3 ? 'right' : hits ? 'partial' : 'wrong'
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Verdict status={status} score={score} secret={secret} practice={practice}
        detail={answer && hits < 3 ? `${hits} of 3 parts right` : null} />
      {PART_KEYS.map((k, i) => {
        const given = answer && (k === 'wh' ? WH_TYPES[answer.wh] : answer[k])
        return (
          <div key={k} className={`rounded-2xl border-2 p-3 bg-white flex flex-col gap-1 ${parts[i] ? 'border-green-500' : 'border-rose-400'}`}>
            <RoleTag part={k} className="self-start" />
            {given && (
              <p className={`flex items-center gap-2 font-black ${parts[i] ? 'text-green-700' : 'text-rose-600'}`}>
                <span className="text-xs uppercase tracking-widest text-slate-500 w-16">You</span>
                <span className="flex-1">{given}</span>
                <span className="text-xl">{parts[i] ? '✓' : '✗'}</span>
              </p>
            )}
            {!parts[i] && (
              <p className="flex items-center gap-2 font-black text-green-700">
                <span className="text-xs uppercase tracking-widest text-slate-500 w-16">Correct</span>
                <span className="flex-1">{correct[k]}</span>
                <span className="text-xl">✓</span>
              </p>
            )}
          </div>
        )
      })}
      {solution.example && (
        <p className="text-center text-slate-600">
          Possible answer: <i className="text-slate-900">“{solution.example}”</i>
        </p>
      )}
    </div>
  )
}
