import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { isOnline } from '../net/store.js'
import { useNow, useStore, useValue } from '../net/hooks.js'
import { SETS, getSet } from '../game/sets.js'
import { WH_TYPES, buildPublicQuestion, checkAnswer, scoreFor, solutionOf } from '../game/logic.js'
import { Button, Center, Logo, PART_KEYS, Prompt, ROLES, RoleTag, TimerBar } from '../ui.jsx'
import { getSound } from './sound.js'

/* El navegador del profesor es el "servidor" de la actividad: baraja, lleva el
   cronómetro, corrige y reparte puntos. La base de datos solo transporta. Todo el
   estado vive en la base, así que recargar esta pestaña retoma la partida. */

const PIN_KEY = 'kachai-host-pin'
const savedPin = {
  get() { try { return sessionStorage.getItem(PIN_KEY) } catch { return null } },
  set(v) { try { v ? sessionStorage.setItem(PIN_KEY, v) : sessionStorage.removeItem(PIN_KEY) } catch { /* sin storage */ } },
}

/* Margen tras el cero para que alcance a llegar una respuesta enviada en el último segundo. */
const GRACE_MS = 800

async function openRoom(store) {
  const saved = savedPin.get()
  if (saved && (await store.get(`rooms/${saved}/meta`))) return saved
  let pin
  do pin = String(100000 + Math.floor(Math.random() * 900000))
  while (await store.get(`rooms/${pin}/meta`))
  await store.update(`rooms/${pin}`, {
    meta: { createdAt: store.stamp(), setId: SETS[0].id, mode: 'select', readSec: 8, answerSec: 30 },
    state: { phase: 'lobby', round: 0 },
  })
  savedPin.set(pin)
  return pin
}

export default function Host() {
  const store = useStore()
  const [pin, setPin] = useState(null)
  const [error, setError] = useState(null)
  const opening = useRef(false)

  useEffect(() => {
    if (!store || opening.current) return
    opening.current = true
    openRoom(store).then(setPin, (e) => setError(e.message))
  }, [store])

  if (error) return <Center>No se pudo crear la sala: {error}</Center>
  if (!pin) return <Center>Creando sala…</Center>
  return <HostRoom store={store} pin={pin} />
}

function HostRoom({ store, pin }) {
  const base = `rooms/${pin}`
  const meta = useValue(store, `${base}/meta`)
  const state = useValue(store, `${base}/state`)
  const players = useValue(store, `${base}/players`) || {}
  const online = useValue(store, `${base}/online`) || {}
  const scores = useValue(store, `${base}/scores`) || {}
  const inGame = state?.qIndex != null && state.phase !== 'lobby'
  const answers = useValue(store, inGame ? `${base}/answers/${state.qIndex}` : null) || {}
  const now = useNow(store)
  const fired = useRef('')

  const set = meta ? getSet(meta.setId) : null
  const question = set && inGame ? set.questions[state.qIndex] : null
  const activeIds = Object.keys(players).filter((id) => online[id] !== false)
  const answeredCount = Object.keys(answers).filter((id) => players[id]).length

  const goQuestion = (i, round = state.round, extra = {}) =>
    store.update(base, {
      ...extra,
      state: {
        phase: 'reading', round, qIndex: i, total: set.questions.length,
        question: buildPublicQuestion(set.questions[i]), startedAt: store.stamp(),
      },
    })
  const start = () => goQuestion(0, (state.round || 0) + 1, { answers: null, scores: null })
  const startAnswering = () => store.update(`${base}/state`, { phase: 'answering', startedAt: store.stamp() })
  const showRanking = () => store.update(`${base}/state`, { phase: 'leaderboard' })
  const next = () =>
    state.qIndex + 1 < set.questions.length
      ? goQuestion(state.qIndex + 1)
      : store.update(`${base}/state`, { phase: 'end' })
  const backToLobby = () =>
    store.update(base, { answers: null, scores: null, state: { phase: 'lobby', round: state.round || 0 } })
  const kick = (id) => store.update(base, { [`players/${id}`]: null, [`scores/${id}`]: null, [`online/${id}`]: null })
  const closeRoom = async () => {
    if (!confirm('¿Cerrar la sala? Los alumnos quedarán fuera.')) return
    await store.remove(base)
    savedPin.set(null)
    location.hash = ''
  }

  async function reveal() {
    const q = set.questions[state.qIndex]
    const got = (await store.get(`${base}/answers/${state.qIndex}`)) || {}
    const answerMs = meta.answerSec * 1000
    const stats = { answered: 0, subject: 0, verb: 0, wh: 0 }
    const nextScores = {}
    for (const id of Object.keys(players)) {
      const a = got[id]
      const before = scores[id]?.total || 0
      let parts = [false, false, false]
      let gain = 0
      if (a) {
        const elapsed = a.at - state.startedAt
        if (elapsed <= answerMs + GRACE_MS) {
          parts = checkAnswer(q, a)
          gain = scoreFor(parts, elapsed, answerMs)
        }
        stats.answered++
        PART_KEYS.forEach((k, i) => { if (parts[i]) stats[k]++ })
      }
      nextScores[id] = { total: before + gain, gain, parts, answered: Boolean(a) }
    }
    Object.entries(nextScores)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([, s], i) => { s.rank = i + 1 })
    await store.update(base, {
      scores: nextScores,
      state: { ...state, phase: 'reveal', solution: solutionOf(q), stats },
    })
  }

  /* Avances automáticos: lectura → respuesta → revelar (al acabar el tiempo o
     cuando respondieron todos los conectados). Cada fase dispara una sola vez. */
  useEffect(() => {
    if (!state || !meta || typeof state.startedAt !== 'number') return
    const key = `${state.round}-${state.qIndex}-${state.phase}`
    if (fired.current === key) return
    if (state.phase === 'reading' && now >= state.startedAt + meta.readSec * 1000) {
      fired.current = key
      startAnswering()
    } else if (state.phase === 'answering') {
      const timeUp = now >= state.startedAt + meta.answerSec * 1000 + GRACE_MS
      const everyone = activeIds.length > 0 && activeIds.every((id) => answers[id])
      if (timeUp || everyone) {
        fired.current = key
        reveal()
      }
    }
  })

  /* Música por fase. Lectura y respuesta comparten tema, así que no se corta
     entre ambas; revelar y ranking vuelven al tema tranquilo del lobby. */
  const track = { lobby: 'lobby', reading: 'answering', answering: 'answering', reveal: 'lobby', leaderboard: 'lobby', end: 'podium' }[state?.phase] ?? null
  useEffect(() => { getSound().play(track) }, [track])
  useEffect(() => () => { getSound().play(null) }, [])

  const secondsLeft = state?.phase === 'answering' && meta && typeof state.startedAt === 'number'
    ? Math.ceil((state.startedAt + meta.answerSec * 1000 - now) / 1000)
    : null
  const lastTick = useRef(null)
  useEffect(() => {
    if (secondsLeft == null) { lastTick.current = null; return }
    if (secondsLeft >= 1 && secondsLeft <= 5 && lastTick.current !== secondsLeft) {
      lastTick.current = secondsLeft
      getSound().tick(secondsLeft)
    }
  }, [secondsLeft])

  const playerCount = Object.keys(players).length
  const lastCount = useRef(null)
  useEffect(() => {
    if (lastCount.current != null && playerCount > lastCount.current) getSound().join()
    lastCount.current = playerCount
  }, [playerCount])

  if (meta === null) {
    return (
      <Center>
        <p className="mb-4">Esta sala ya no existe.</p>
        <Button onClick={() => { savedPin.set(null); location.reload() }}>Crear otra sala</Button>
      </Center>
    )
  }
  if (!meta || !state) return <Center>Cargando sala…</Center>

  const ranking = Object.entries(scores)
    .filter(([id]) => players[id])
    .map(([id, s]) => ({ id, name: players[id].name, ...s }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 bg-white border-b border-slate-200">
        <Logo className="text-2xl" />
        <span className="text-slate-500">PIN <b className="text-slate-900 tracking-widest">{pin}</b></span>
        <span className="text-slate-500">{activeIds.length} conectados</span>
        {inGame && <span className="text-slate-500">Pregunta {state.qIndex + 1} / {state.total}</span>}
        {!isOnline && (
          <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1">
            MODO LOCAL · solo pestañas de este navegador
          </span>
        )}
        <SoundControl className="ml-auto" />
        <Button variant="danger" className="!py-2 text-sm" onClick={closeRoom}>Cerrar sala</Button>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6">
        {state.phase === 'lobby' && (
          <Lobby store={store} base={base} pin={pin} meta={meta} players={players} online={online}
            onKick={kick} onStart={start} />
        )}

        {(state.phase === 'reading' || state.phase === 'answering') && (
          <section className="flex flex-col gap-10 pt-6">
            <p className="text-center text-lg font-bold uppercase tracking-widest text-slate-500">
              {state.phase === 'reading' ? 'Read the question…' : 'Answer on your phone!'}
            </p>
            <Prompt text={state.question.prompt} className="text-center text-5xl md:text-7xl" />
            <TimerBar
              start={state.startedAt}
              ms={(state.phase === 'reading' ? meta.readSec : meta.answerSec) * 1000}
              now={now}
              className="max-w-3xl w-full mx-auto"
            />
            {state.phase === 'answering' && (
              <>
                <div className="flex justify-center gap-3">
                  {PART_KEYS.map((k) => <RoleTag key={k} part={k} className="text-base px-3 py-1" />)}
                </div>
                <p className="text-center text-2xl text-slate-600">
                  <b className="text-slate-900 text-4xl tabular-nums">{answeredCount}</b> / {activeIds.length} answered
                </p>
              </>
            )}
            <div className="flex justify-center">
              <Button variant="ghost" onClick={state.phase === 'reading' ? startAnswering : reveal}>
                {state.phase === 'reading' ? 'Saltar lectura' : 'Terminar tiempo'}
              </Button>
            </div>
          </section>
        )}

        {state.phase === 'reveal' && state.solution && (
          <Reveal state={state} onNext={showRanking} />
        )}

        {state.phase === 'leaderboard' && (
          <section className="max-w-3xl mx-auto flex flex-col gap-6">
            <h2 className="text-4xl font-black text-center">Ranking</h2>
            <ol className="flex flex-col gap-2">
              {ranking.slice(0, 10).map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-xl">
                  <span className="w-8 font-black text-slate-400">{i + 1}</span>
                  <span className="flex-1 font-bold truncate">{p.name}</span>
                  {p.gain > 0 && <span className="text-green-600 font-bold">+{p.gain}</span>}
                  <span className="w-24 text-right font-black tabular-nums">{p.total}</span>
                </li>
              ))}
            </ol>
            <div className="flex justify-center">
              <Button onClick={next}>
                {state.qIndex + 1 < state.total ? 'Siguiente pregunta →' : 'Resultados finales 🏆'}
              </Button>
            </div>
          </section>
        )}

        {state.phase === 'end' && (
          <Podium ranking={ranking} onAgain={backToLobby} />
        )}
      </main>
    </div>
  )
}

function Lobby({ store, base, pin, meta, players, online, onKick, onStart }) {
  const joinUrl = `${location.origin}${location.pathname}#/play?pin=${pin}`
  const [qr, setQr] = useState('')
  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 360 }).then(setQr)
  }, [joinUrl])

  const setMeta = (patch) => store.update(`${base}/meta`, patch)
  const list = Object.entries(players).sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0))

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-6">
      <section className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col items-center text-center gap-3">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Join the game</p>
        {qr && <img src={qr} alt="Código QR para unirse" className="w-64 h-64" />}
        <p className="text-slate-500 break-all text-sm">{joinUrl.replace(/^https?:\/\//, '')}</p>
        <p className="text-slate-500">Game PIN</p>
        <p className="text-6xl font-black tracking-[.2em] text-slate-900">{pin}</p>
      </section>

      <section className="flex flex-col gap-5">
        <div className="rounded-3xl bg-white border border-slate-200 p-5 flex flex-col gap-4">
          <Field label="Set de preguntas">
            <div className="grid sm:grid-cols-3 gap-2">
              {SETS.map((s) => (
                <button key={s.id} onClick={() => setMeta({ setId: s.id })}
                  className={`rounded-xl border-2 p-3 text-left transition ${meta.setId === s.id ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="block font-bold">{s.name}</span>
                  <span className="block text-xs text-slate-500">{s.topics} · {s.questions.length} preguntas</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Sujeto y verbo">
            <Segmented value={meta.mode} onChange={(mode) => setMeta({ mode })}
              options={[['select', 'Elegir de una lista'], ['write', 'Escribirlos']]} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tiempo de lectura">
              <Segmented value={meta.readSec} onChange={(readSec) => setMeta({ readSec })}
                options={[[5, '5 s'], [8, '8 s'], [12, '12 s']]} />
            </Field>
            <Field label="Tiempo para responder">
              <Segmented value={meta.answerSec} onChange={(answerSec) => setMeta({ answerSec })}
                options={[[20, '20 s'], [30, '30 s'], [45, '45 s'], [60, '60 s']]} />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-5 flex-1">
          <p className="font-bold mb-3">Alumnos ({list.length})</p>
          {list.length === 0 && <p className="text-slate-400">Esperando que se unan…</p>}
          <ul className="flex flex-wrap gap-2">
            {list.map(([id, p]) => (
              <li key={id}
                className={`group flex items-center gap-1 rounded-full pl-3 pr-1 py-1 font-bold border ${online[id] === false ? 'text-slate-400 border-dashed border-slate-300' : 'bg-slate-100 border-slate-200'}`}>
                {p.name}
                <button onClick={() => onKick(id)} title="Expulsar"
                  className="w-6 h-6 rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-700">×</button>
              </li>
            ))}
          </ul>
        </div>

        <Button className="text-xl py-4" disabled={list.length === 0} onClick={onStart}>
          Comenzar ▶
        </Button>
      </section>
    </div>
  )
}

function SoundControl({ className = '' }) {
  const sound = getSound()
  const [s, setS] = useState(sound.state)
  useEffect(() => sound.subscribe(setS), [sound])

  if (!s.running) {
    return (
      <button onClick={sound.unlock}
        className={`rounded-full bg-amber-100 text-amber-900 font-bold text-sm px-4 py-2 animate-pulse ${className}`}>
        🔈 Activar sonido
      </button>
    )
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button onClick={() => sound.setMuted(!s.muted)} title={s.muted ? 'Activar sonido' : 'Silenciar'}
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-xl">
        {s.muted ? '🔇' : '🔊'}
      </button>
      <input type="range" min="0" max="1" step="0.05" value={s.volume} aria-label="Volumen"
        disabled={s.muted} onChange={(e) => sound.setVolume(Number(e.target.value))}
        className="w-24 accent-[#0F6FD6] disabled:opacity-40" />
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-500 mb-2">{label}</p>
      {children}
    </div>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 gap-1">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${value === v ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Reveal({ state, onNext }) {
  const { solution, stats } = state
  const pct = (k) => (stats.answered ? Math.round((stats[k] / stats.answered) * 100) : 0)
  const shown = {
    subject: solution.subject.join(' / '),
    verb: solution.verb.join(' / '),
    wh: WH_TYPES[solution.wh],
  }
  return (
    <section className="flex flex-col gap-8 pt-4">
      <Prompt text={state.question.prompt} className="text-center text-4xl md:text-5xl" />
      <div className="grid md:grid-cols-3 gap-4">
        {PART_KEYS.map((k) => (
          <div key={k} className={`rounded-3xl border-2 p-6 flex flex-col gap-3 ${ROLES[k].border} ${ROLES[k].tint}`}>
            <RoleTag part={k} className="self-start" />
            <p className={`text-3xl font-black ${ROLES[k].text}`}>{shown[k]}</p>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div className={`h-full ${ROLES[k].solid}`} style={{ width: `${pct(k)}%` }} />
            </div>
            <p className="text-sm font-bold text-slate-600">{pct(k)}% correct</p>
          </div>
        ))}
      </div>
      {solution.example && (
        <p className="text-center text-2xl text-slate-600">
          Possible answer: <i className="text-slate-900">“{solution.example}”</i>
        </p>
      )}
      <p className="text-center text-slate-500">{stats.answered} answers</p>
      <div className="flex justify-center">
        <Button onClick={onNext}>Ver ranking →</Button>
      </div>
    </section>
  )
}

function Podium({ ranking, onAgain }) {
  const [first, second, third] = ranking
  const step = (p, place, h, medal) => p && (
    <div className="flex flex-col items-center gap-2 w-40">
      <span className="text-4xl">{medal}</span>
      <span className="font-black text-xl text-center truncate w-full">{p.name}</span>
      <span className="font-bold tabular-nums text-slate-600">{p.total}</span>
      <div className={`w-full rounded-t-2xl bg-[#0F6FD6] text-white grid place-items-center text-4xl font-black ${h}`}>{place}</div>
    </div>
  )
  return (
    <section className="flex flex-col items-center gap-8 pt-4">
      <h2 className="text-4xl font-black">Final results</h2>
      <div className="flex items-end gap-4">
        {step(second, 2, 'h-28', '🥈')}
        {step(first, 1, 'h-40', '🥇')}
        {step(third, 3, 'h-20', '🥉')}
      </div>
      {ranking.length > 3 && (
        <ol start={4} className="w-full max-w-xl flex flex-col gap-1">
          {ranking.slice(3).map((p, i) => (
            <li key={p.id} className="flex gap-4 rounded-xl bg-white border border-slate-200 px-4 py-2">
              <span className="w-6 text-slate-400 font-bold">{i + 4}</span>
              <span className="flex-1 font-bold truncate">{p.name}</span>
              <span className="tabular-nums font-bold">{p.total}</span>
            </li>
          ))}
        </ol>
      )}
      <Button onClick={onAgain}>Jugar otra vez</Button>
    </section>
  )
}
