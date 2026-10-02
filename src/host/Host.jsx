import { Fragment, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { isOnline } from '../net/store.js'
import { useNow, useStore, useUser, useValue } from '../net/hooks.js'
import { ACTIVITY_TYPES, COURSES, LEVELS, SETS, courseOf, getSet, sameTypeIn } from '../game/sets.js'
import { WH_TYPES, buildPublicQuestion, historyEntry, historyKey, isChoice, reviewQuestion, checkAnswer, nextStreak, scoreFor, solutionOf } from '../game/logic.js'
import { Button, CHOICE_STYLES, Center, Logo, PART_KEYS, Prompt, ROLES, RoleTag, StreakBadge, TimerBar, choiceCols } from '../ui.jsx'
import { answeringTrack, getSound } from './sound.js'
import Editor, { blankQuestion } from './Editor.jsx'
import {
  applyLibrary, customIndexPath, customQuestionsPath, customSet, isCustomId, libraryPath, newCustomId,
} from '../game/library.js'
import { PODIUM_SOUNDS, podiumStage } from '../game/podium.js'
import { BOARD_SIZE, buildBoard, previousTotals } from '../game/duels.js'
import {
  MAX_TEAMS, TEAM_MAX, TEAM_MIN, makeTeams, membersOf, mvpOf, presetOf, shuffleIntoTeams, smallestTeam,
  suggestTeamCount, teamIdsOf, teamRanking,
} from '../game/teams.js'
import confetti from 'canvas-confetti'

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
  const user = useUser(store)
  /* Biblioteca personal: sus versiones editadas reemplazan a las originales. */
  const library = useValue(store, user ? libraryPath(user.uid) : null) || {}
  const [editing, setEditing] = useState(null)

  /* Actividades propias: el índice (liviano) siempre; las preguntas, que pueden
     traer imágenes, solo de la elegida. */
  const customIndex = useValue(store, user ? customIndexPath(user.uid) : null) || {}
  const customId = isCustomId(meta?.setId) ? meta.setId : null
  const customQuestions = useValue(store, user && customId ? customQuestionsPath(user.uid, customId) : null)
  const customReady = Boolean(customId && customIndex[customId] && customQuestions)
  const set = !meta ? null
    : customReady ? customSet(customId, customIndex[customId], customQuestions)
    : applyLibrary(getSet(meta.setId), library[meta.setId])
  const setReady = !customId || customReady
  /* La pregunta de práctica va con qIndex -1: así sus respuestas quedan aparte y
     "Pregunta N / total" sigue contando solo las reales. */
  const questionAt = (i) => (i < 0 ? set.practice : set.questions[i])
  const current = set && inGame ? questionAt(state.qIndex) : null
  const activeIds = Object.keys(players).filter((id) => online[id] !== false)
  const teamMode = meta?.teamMode === 'teams'
  const teams = meta?.teams || {}
  const teamIds = teamIdsOf(teams)

  /* Quien no tiene equipo (no eligió, o llegó tarde) va al más pequeño. */
  const fillTeams = () => {
    if (!teamMode || !teamIds.length) return {}
    const draft = Object.fromEntries(Object.entries(players).map(([id, p]) => [id, { ...p }]))
    const patch = {}
    for (const id of Object.keys(draft)) {
      if (teams[draft[id].team]) continue
      draft[id].team = smallestTeam(teamIds, draft)
      patch[`players/${id}/team`] = draft[id].team
    }
    return patch
  }
  const answeredCount = Object.keys(answers).filter((id) => players[id]).length

  const goQuestion = (i, round = state.round, extra = {}) =>
    store.update(base, {
      ...extra,
      state: {
        phase: 'reading', round, qIndex: i, total: set.questions.length, practice: i < 0,
        question: buildPublicQuestion(questionAt(i)), startedAt: store.stamp(),
      },
    })
  const withPractice = meta?.practice !== false && Boolean(set?.practice)
  const start = () => goQuestion(withPractice ? -1 : 0, (state.round || 0) + 1, { answers: null, scores: null, ...fillTeams() })
  /* Tras el simulacro todos vuelven a 0: sus puntos solo se mostraron. */
  const startForReal = () => goQuestion(0, state.round, { answers: null, scores: null })
  const startAnswering = () => store.update(`${base}/state`, { phase: 'answering', startedAt: store.stamp() })
  const isLast = !state?.practice && state?.qIndex + 1 >= set?.questions.length
  /* Al abrir el ranking se arma el tablero de duelos (ver game/duels.js) y se
     publica: proyector y celulares muestran los mismos VS. */
  const showRanking = () => {
    const now = teamMode ? teamRanking(teams, players, scores) : individualRanking(players, scores)
    const beforeLast = state.qIndex + 2 === set.questions.length
    store.update(`${base}/state`, { phase: 'leaderboard', board: buildBoard(now, previousTotals(now), beforeLast) })
  }
  /* Tras la última pregunta no hay ranking: se salta directo al podio, que se
     revela por partes (ver game/podium.js) para mantener el suspenso. */
  /* Con el podio se publican las preguntas con sus soluciones: ya terminó el
     juego, y cada celular arma con ellas el resumen de su alumno. */
  const showPodium = () => store.update(`${base}/state`, {
    phase: 'end', startedAt: store.stamp(), review: set.questions.map(reviewQuestion),
  })
  const next = () => (isLast ? showPodium() : goQuestion(state.qIndex + 1))
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
    const q = questionAt(state.qIndex)
    const got = (await store.get(`${base}/answers/${state.qIndex}`)) || {}
    const answerMs = meta.answerSec * 1000
    const choice = state.question.kind === 'choice'
    /* La opción múltiple cuenta votos por alternativa (en el orden que se proyectó):
       las opciones llevan "/" o "." y no sirven como claves en la base. */
    const stats = choice
      ? { answered: 0, correct: 0, votes: state.question.options.map(() => 0) }
      : { answered: 0, subject: 0, verb: 0, wh: 0 }
    const nextScores = {}
    for (const id of Object.keys(players)) {
      const a = got[id]
      const before = scores[id]?.total || 0
      let parts = choice ? [false] : [false, false, false]
      let gain = 0
      if (a) {
        const elapsed = a.at - state.startedAt
        if (elapsed <= answerMs + GRACE_MS) {
          parts = checkAnswer(q, a)
          gain = scoreFor(parts, elapsed, answerMs)
        }
        stats.answered++
        if (choice) {
          const i = state.question.options.indexOf(a.choice)
          if (i >= 0) stats.votes[i]++
          if (parts[0]) stats.correct++
        } else {
          PART_KEYS.forEach((k, i) => { if (parts[i]) stats[k]++ })
        }
      }
      nextScores[id] = {
        total: state.practice ? before : before + gain, gain, parts, answered: Boolean(a),
        streak: state.practice ? 0 : nextStreak(scores[id]?.streak, parts),
        // para el resumen final de cada alumno (la práctica no cuenta)
        history: state.practice ? null : { ...scores[id]?.history, [historyKey(state.qIndex)]: historyEntry(q, a, parts, gain) },
      }
    }
    Object.entries(nextScores)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([, s], i) => { s.rank = i + 1 })
    await store.update(base, {
      scores: nextScores,
      state: { ...state, phase: 'reveal', solution: solutionOf(q), stats },
    })
  }

  /* Atrasados en pleno juego: se suman al equipo más pequeño apenas entran. */
  const unassigned = teamMode && inGame && Object.values(players).some((p) => !teams[p.team])
  useEffect(() => {
    if (!unassigned) return
    const patch = fillTeams()
    if (Object.keys(patch).length) store.update(base, patch)
  }, [unassigned, players])

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

  /* Música por fase. La lectura va en silencio para concentrarse; el tema de
     responder arranca con el cronómetro. Revelar y ranking tampoco llevan música. */
  const stage = podiumStage(state?.phase === 'end' ? state.startedAt : null, now)
  const track = state?.phase === 'end'
    ? (stage.first ? 'podium' : null) // la fanfarria llega con el primer lugar
    : ({ lobby: 'lobby', answering: answeringTrack(state?.round, state?.qIndex) }[state?.phase] ?? null)
  useEffect(() => { getSound().play(track) }, [track])
  useEffect(() => () => { getSound().play(null) }, [])

  /* Sonidos del podio (ver PODIUM_SOUNDS): el efecto arranca ANTES de que aparezca
     cada puesto, para que su remate caiga justo encima. Se programan con
     temporizadores contra el reloj del servidor, una vez por ronda. */
  const podiumKey = state?.phase === 'end' && typeof state.startedAt === 'number' ? `${state.round}-${state.startedAt}` : null
  const scheduledPodium = useRef(null)
  const stopDrumroll = useRef(null)
  useEffect(() => {
    if (!podiumKey || scheduledPodium.current === podiumKey) return
    scheduledPodium.current = podiumKey
    const elapsed = store.now() - state.startedAt
    const timers = PODIUM_SOUNDS
      .filter((cue) => cue.at >= elapsed - 100) // al recargar en pleno podio no se repite lo ya sonado
      .flatMap((cue) => [
        setTimeout(() => {
          getSound().effect(cue.effect).then((stop) => { if (cue.stopAt) stopDrumroll.current = stop })
        }, Math.max(0, cue.at - elapsed)),
        // el redoble del 1.º se corta con su propio reloj, unos ms ANTES de su remate:
        // esperar al cambio de etapa (se revisa cada 200 ms) dejaría asomar la fanfarria corta
        ...(cue.stopAt ? [setTimeout(() => { stopDrumroll.current?.(); stopDrumroll.current = null }, Math.max(0, cue.stopAt - 40 - elapsed))] : []),
      ])
    return () => timers.forEach(clearTimeout)
  }, [podiumKey])

  /* Un efecto al entrar en cada fase clave, una vez por pregunta. */
  const phaseEffect = { reading: 'question', reveal: 'reveal', leaderboard: 'ranking' }[state?.phase]
  const phaseKey = state ? `${state.round}-${state.qIndex}-${state.phase}` : null
  const lastEffect = useRef(null)
  useEffect(() => {
    if (!phaseEffect || lastEffect.current === phaseKey) return
    lastEffect.current = phaseKey
    getSound().effect(phaseEffect)
  }, [phaseKey, phaseEffect])

  const secondsLeft = state?.phase === 'answering' && meta && typeof state.startedAt === 'number'
    ? Math.ceil((state.startedAt + meta.answerSec * 1000 - now) / 1000)
    : null
  const lastTick = useRef(null)
  const countdown = secondsLeft != null && secondsLeft <= 5
  useEffect(() => { getSound().duck(countdown) }, [countdown])
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

  const ranking = individualRanking(players, scores)
  const teamRank = teamMode ? teamRanking(teams, players, scores) : null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 bg-white border-b border-slate-200">
        <Logo className="text-2xl" />
        <span className="text-slate-500">PIN <b className="text-slate-900 tracking-widest">{pin}</b></span>
        <span className="text-slate-500">{activeIds.length} conectados</span>
        {inGame && (state.practice
          ? <span className="rounded-full bg-violet-100 text-violet-800 text-xs font-bold px-3 py-1">PRÁCTICA · no suma puntos</span>
          : <span className="text-slate-500">Pregunta {state.qIndex + 1} / {state.total}</span>)}
        {!isOnline && (
          <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1">
            MODO LOCAL · solo pestañas de este navegador
          </span>
        )}
        <SoundControl className="ml-auto" />
        {isOnline && <Account store={store} user={user} />}
        <Button variant="danger" className="!py-2 text-sm" onClick={closeRoom}>Cerrar sala</Button>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6">
        {state.phase === 'lobby' && editing && user && (
          <ActivityEditor store={store} user={user} editing={editing} library={library} customIndex={customIndex}
            current={set} onSelect={(setId) => store.update(`${base}/meta`, { setId })} onClose={() => setEditing(null)} />
        )}
        {state.phase === 'lobby' && !editing && (
          <Lobby store={store} base={base} pin={pin} meta={meta} players={players} online={online}
            set={set} setReady={setReady} user={user} library={library} customIndex={customIndex}
            onKick={kick} onStart={start}
            onEdit={async (id) => {
              if (!user && !(await signInFriendly(store))) return
              setEditing(isCustomId(id) ? { kind: 'custom', id, info: customIndex[id] } : { kind: 'base', id })
            }}
            onCreate={async (info) => {
              if (!user && !(await signInFriendly(store))) return
              setEditing({ kind: 'custom', id: newCustomId(), info, isNew: true })
            }} />
        )}

        {(state.phase === 'reading' || state.phase === 'answering') && (
          <section className={`flex flex-col pt-6 ${current?.image ? "gap-5" : "gap-10"}`}>
            <p className="text-center text-lg font-bold uppercase tracking-widest text-slate-500">
              {state.practice && <span className="block text-violet-600">Practice question</span>}
              {state.phase === 'reading' ? 'Read the question…' : 'Answer on your phone!'}
            </p>
            {/* Grande mientras leen; al responder se achica para que entren las alternativas. */}
            {current?.image && <QuestionImage src={current.image} className={state.phase === 'reading' ? 'max-h-[42vh]' : 'max-h-[24vh]'} />}
            <Prompt text={state.question.prompt} highlightWh={state.question.kind !== 'choice'}
              className={`text-center ${current?.image ? 'text-4xl md:text-5xl' : 'text-5xl md:text-7xl'}`} />
            <TimerBar
              start={state.startedAt}
              ms={(state.phase === 'reading' ? meta.readSec : meta.answerSec) * 1000}
              now={now}
              className="max-w-3xl w-full mx-auto"
            />
            {state.phase === 'answering' && (
              <>
                {state.question.kind === 'choice'
                  ? <ChoiceTiles options={state.question.options} />
                  : <BuilderOptions question={state.question} mode={meta.mode} />}
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
          <Reveal state={state} isLast={isLast} ranking={ranking} image={current?.image}
            onNext={state.practice ? startForReal : isLast ? showPodium : showRanking} />
        )}

        {state.phase === 'leaderboard' && (
          <Leaderboard board={state.board} onNext={next}
            title={teamMode ? 'Team ranking' : 'Ranking'}
            footnote={teamMode ? 'Team points = the average of its players' : null}
            rows={teamMode
              ? teamRank.map((t) => ({ ...t, tint: `${presetOf(t.id).tint} ${presetOf(t.id).border} border-2`, extra: <span className="text-base font-normal text-slate-500">· {t.members.length}</span> }))
              : ranking.map((p) => ({ ...p, extra: <StreakBadge streak={p.streak} className="text-base shrink-0" /> }))} />
        )}

        {state.phase === 'end' && (
          <Podium ranking={teamRank ?? ranking} mvp={teamMode ? mvpOf(players, scores) : null} stage={stage} onAgain={backToLobby} />
        )}
      </main>
      {state.phase !== 'lobby' && <JoinCorner pin={pin} />}
    </div>
  )
}

function Lobby({ store, base, pin, meta, players, online, set, setReady, user, library, customIndex, onKick, onStart, onEdit, onCreate }) {
  const joinUrl = `${location.origin}${location.pathname}#/play?pin=${pin}`
  const [qr, setQr] = useState('')
  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 360 }).then(setQr)
  }, [joinUrl])

  const setMeta = (patch) => store.update(`${base}/meta`, patch)
  const count = (a) => applyLibrary(a, library[a.id]).questions.length
  const mine = (a) => Boolean(library[a.id])
  const course = courseOf(set)
  const ea = course.eas.find((e) => e.ea === set.ea)
  const eaIndex = course.eas.indexOf(ea)
  const focusList = ea.activities.filter((a) => a.type === 'grammar-focus')
  const teamMode = meta.teamMode === 'teams'
  const setTeamMode = (mode) => setMeta(mode === 'teams' && !meta.teams
    ? { teamMode: mode, teamPick: meta.teamPick || 'random', teams: makeTeams(suggestTeamCount(Object.keys(players).length)) }
    : { teamMode: mode })
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
          <Field label="Curso">
            <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-2 items-center">
              {LEVELS.map((level) => (
                <Fragment key={level}>
                  <span className="text-sm font-bold text-slate-500 pr-1">{level}</span>
                  {COURSES.filter((c) => c.level === level).map((c) => (
                    <button key={c.id} onClick={() => setMeta({ setId: sameTypeIn(c.eas[eaIndex], set.type).id })}
                      className={`min-w-0 rounded-xl border-2 px-1 py-2 text-sm sm:text-base font-bold transition ${course.id === c.id ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      {c.label}
                    </button>
                  ))}
                </Fragment>
              ))}
            </div>
          </Field>
          <Field label={`Experiencia de aprendizaje · ${course.book}`}>
            <div className="grid sm:grid-cols-2 gap-2">
              {course.eas.map((e) => (
                <button key={e.ea} onClick={() => setMeta({ setId: sameTypeIn(e, set.type).id })}
                  className={`rounded-xl border-2 p-3 text-left transition ${ea === e ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="block font-bold">{e.ea} <span className="font-normal text-slate-500">· {e.files}</span></span>
                  <span className="block text-xs text-slate-500">{e.topics}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Actividad">
            <div className="grid sm:grid-cols-2 gap-2">
              {ea.activities.filter((a) => a.type !== 'grammar-focus').map((a) => (
                <button key={a.id} onClick={() => setMeta({ setId: a.id })}
                  className={`rounded-xl border-2 p-3 text-left transition ${set.id === a.id ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="block font-bold">
                    {a.title} <span className="font-normal text-slate-500">· {count(a)} preguntas</span>
                  </span>
                  {mine(a) && <MineBadge />}
                  <span className="block text-xs text-slate-500">{ACTIVITY_TYPES[a.type].description}</span>
                </button>
              ))}
            </div>
            {/* Los Grammar Focus pueden ser muchos (el intensivo junta dos cursos): van como lista compacta de temas. */}
            {focusList.length > 0 && (
              <div className={`mt-2 rounded-xl border-2 p-3 transition ${set.type === 'grammar-focus' ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200'}`}>
                <p className="font-bold">
                  {ACTIVITY_TYPES['grammar-focus'].name}
                  <span className="font-normal text-slate-500"> · un contenido, {focusList[0].questions.length} preguntas</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {focusList.map((a) => (
                    <button key={a.id} onClick={() => setMeta({ setId: a.id })}
                      className={`rounded-full border px-3 py-1 text-sm font-bold transition ${set.id === a.id ? 'bg-[#0F6FD6] border-[#0F6FD6] text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'}`}>
                      {a.topic}{mine(a) && ' ✏️'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <MyActivities user={user} entries={Object.entries(customIndex)
              .filter(([, info]) => info.course === course.id && info.ea === eaIndex)
              .sort((a, b) => (a[1].title || '').localeCompare(b[1].title || ''))}
              selected={meta.setId} onSelect={(setId) => setMeta({ setId })}
              onCreate={(mechanic) => onCreate({ mechanic, course: course.id, ea: eaIndex, title: '' })} />
            <button onClick={() => onEdit(set.id)}
              className="mt-2 text-sm font-bold text-[#0F6FD6] hover:underline">
              ✏️ Editar “{set.topic ?? set.title}”{mine(set) ? ' (tu versión)' : ''}
            </button>
          </Field>
          {set.practice && (
            <Field label="Pregunta de práctica al inicio (no suma puntos)">
              <Segmented value={meta.practice !== false} onChange={(practice) => setMeta({ practice })}
                options={[[true, 'Sí'], [false, 'No']]} />
            </Field>
          )}
          {(set.type === 'answer-builder' || set.mechanic === 'builder') && (
            <Field label="Sujeto y verbo">
              <Segmented value={meta.mode} onChange={(mode) => setMeta({ mode })}
                options={[['select', 'Elegir de una lista'], ['write', 'Escribirlos']]} />
            </Field>
          )}
          <Field label="Modo de juego">
            <Segmented value={teamMode ? 'teams' : 'solo'} onChange={setTeamMode}
              options={[['solo', 'Individual'], ['teams', 'Equipos']]} />
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

        {teamMode && <TeamsPanel store={store} base={base} meta={meta} players={players} online={online} onKick={onKick} />}
        <div className={`rounded-3xl bg-white border border-slate-200 p-5 flex-1 ${teamMode ? 'hidden' : ''}`}>
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

        {!setReady && (
          <p className="text-center text-sm font-bold text-amber-700">
            {user ? 'Cargando tu actividad…' : 'Inicia sesión para usar tu actividad, o elige otra.'}
          </p>
        )}
        <Button className="text-xl py-4" disabled={list.length === 0 || !setReady} onClick={onStart}>
          Comenzar ▶
        </Button>
      </section>
    </div>
  )
}

/* Armado de equipos en el lobby: al azar (el profesor reparte) o que elijan en
   el celular. Todo queda editable: nombres, cantidad y quién va dónde. */
function TeamsPanel({ store, base, meta, players, online, onKick }) {
  const teams = meta.teams || {}
  const ids = teamIdsOf(teams)
  const pick = meta.teamPick || 'random'
  const everyone = Object.keys(players).sort((a, b) => (players[a].joinedAt || 0) - (players[b].joinedAt || 0))
  const unassigned = everyone.filter((id) => !teams[players[id].team])

  const setCount = (n) => {
    const next = makeTeams(n, teams)
    const patch = { 'meta/teams': next }
    // quien estaba en un equipo que desaparece queda sin equipo
    for (const id of everyone) if (players[id].team && !next[players[id].team]) patch[`players/${id}/team`] = null
    store.update(base, patch)
  }
  const shuffle = () => {
    const assigned = shuffleIntoTeams(everyone, ids)
    store.update(base, Object.fromEntries(Object.entries(assigned).map(([id, t]) => [`players/${id}/team`, t])))
  }
  const move = (id, team) => store.update(`${base}/players/${id}`, { team: team || null })
  const rename = (team, name) => {
    const clean = name.trim().slice(0, 20)
    if (clean && clean !== teams[team].name) store.update(`${base}/meta/teams/${team}`, { name: clean })
  }

  const member = (id) => (
    <li key={id}
      className={`flex items-center gap-1 rounded-full bg-white border pl-3 pr-1 py-0.5 text-sm font-bold ${online[id] === false ? 'text-slate-400 border-dashed' : 'border-slate-200'}`}>
      <span className="truncate max-w-[9rem]">{players[id].name}</span>
      <select value={teams[players[id].team] ? players[id].team : ''} onChange={(e) => move(id, e.target.value)}
        title="Mover a otro equipo" className="bg-transparent text-sm cursor-pointer">
        <option value="">—</option>
        {ids.map((t) => <option key={t} value={t}>{teams[t].emoji}</option>)}
      </select>
      <button onClick={() => onKick(id)} title="Expulsar"
        className="w-5 h-5 rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-700">×</button>
    </li>
  )

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 flex-1 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-bold">Equipos · {everyone.length} alumnos</p>
        <Segmented value={pick} onChange={(teamPick) => store.update(`${base}/meta`, { teamPick })}
          options={[['random', 'Al azar'], ['choose', 'Ellos eligen']]} />
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 gap-1">
          <button onClick={() => setCount(ids.length - 1)} disabled={ids.length <= 2}
            className="w-8 h-8 rounded-lg font-black hover:bg-white disabled:opacity-30">−</button>
          <span className="px-1 text-sm font-bold tabular-nums">{ids.length} equipos</span>
          <button onClick={() => setCount(ids.length + 1)} disabled={ids.length >= MAX_TEAMS}
            className="w-8 h-8 rounded-lg font-black hover:bg-white disabled:opacity-30">+</button>
        </div>
        <Button variant="ghost" className="!py-2 text-sm" onClick={shuffle} disabled={!everyone.length}>🎲 Repartir al azar</Button>
      </div>
      <p className="text-sm text-slate-500">
        {pick === 'choose'
          ? 'Cada alumno elige su equipo en el celular. '
          : 'Toca “Repartir al azar” cuando estén todos. '}
        De {TEAM_MIN} a {TEAM_MAX} por equipo. Puedes mover a cualquiera con su menú, y quien quede sin equipo entra al más pequeño al comenzar.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {ids.map((t) => {
          const members = membersOf(t, players)
          const off = members.length < TEAM_MIN || members.length > TEAM_MAX
          const st = presetOf(t)
          return (
            <div key={t} className={`rounded-2xl border-2 p-3 ${st.border} ${st.tint}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{teams[t].emoji}</span>
                <input key={teams[t].name} defaultValue={teams[t].name} maxLength={20} aria-label="Nombre del equipo"
                  onBlur={(e) => rename(t, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="flex-1 min-w-0 bg-transparent font-black outline-none border-b border-transparent focus:border-slate-400" />
                <span title={`De ${TEAM_MIN} a ${TEAM_MAX} por equipo`}
                  className={`rounded-full px-2 text-sm font-black tabular-nums ${off ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-600'}`}>
                  {members.length}
                </span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5 min-h-[1.75rem]">{members.map(member)}</ul>
            </div>
          )
        })}
        {unassigned.length > 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-3">
            <p className="font-black text-slate-500">Sin equipo · {unassigned.length}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">{unassigned.map(member)}</ul>
          </div>
        )}
      </div>
    </div>
  )
}

/* Las actividades que el docente creó desde cero, en el curso y EA elegidos. */
function MyActivities({ user, entries, selected, onSelect, onCreate }) {
  const [choosing, setChoosing] = useState(false)
  return (
    <div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 p-3">
      <p className="font-bold">
        Mis actividades <span className="font-normal text-slate-500">· creadas por ti, solo tú las ves</span>
      </p>
      {entries.length > 0 && (
        <div className="mt-2 grid sm:grid-cols-2 gap-2">
          {entries.map(([id, info]) => (
            <button key={id} onClick={() => onSelect(id)}
              className={`rounded-lg border-2 px-3 py-2 text-left transition ${selected === id ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <span className="block font-bold truncate">{info.title}</span>
              <span className="block text-xs text-slate-500">
                {info.mechanic === 'choice' ? 'Opción múltiple' : 'Answer Builder'} · {info.count} preguntas
              </span>
            </button>
          ))}
        </div>
      )}
      {!choosing ? (
        <button onClick={() => setChoosing(true)} className="mt-2 text-sm font-bold text-[#0F6FD6] hover:underline">
          + Crear actividad{user ? '' : ' (inicia sesión con Google)'}
        </button>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-slate-600">¿De qué tipo?</span>
          <Button variant="ghost" className="!py-1.5 text-sm" onClick={() => { setChoosing(false); onCreate('choice') }}>
            Opción múltiple (tipo Kahoot)
          </Button>
          <Button variant="ghost" className="!py-1.5 text-sm" onClick={() => { setChoosing(false); onCreate('builder') }}>
            Answer Builder
          </Button>
          <button onClick={() => setChoosing(false)} className="text-slate-500 hover:underline">Cancelar</button>
        </div>
      )}
    </div>
  )
}

/* Arma el editor según qué se edita: la versión propia de una actividad base,
   o una actividad creada desde cero (nueva o existente). */
function ActivityEditor({ store, user, editing, library, customIndex, current, onSelect, onClose }) {
  const root = `libraries/${user.uid}`
  if (editing.kind === 'base') {
    const original = getSet(editing.id)
    const edited = library[editing.id]
    return (
      <Editor key={editing.id} heading="Editando tu versión de"
        title={`${original.courseName} · ${original.ea} · ${original.title}`}
        subheading={`Los cambios son solo tuyos (${user.name}); los demás docentes siguen viendo la original.`}
        mechanic={isChoice(original.questions[0]) ? 'choice' : 'builder'}
        questions={applyLibrary(original, edited).questions}
        onSave={(questions) => store.set(`${libraryPath(user.uid)}/${editing.id}`, { questions, updatedAt: store.stamp() })}
        discardLabel={edited ? 'Restaurar original' : null}
        onDiscard={async () => {
          if (!confirm('¿Volver a la versión original? Se perderán tus cambios en esta actividad.')) return false
          await store.remove(`${libraryPath(user.uid)}/${editing.id}`)
          return true
        }}
        onClose={onClose} />
    )
  }

  const info = customIndex[editing.id] ?? editing.info
  const course = COURSES.find((c) => c.id === info.course)
  const questions = editing.isNew
    ? [blankQuestion(info.mechanic)]
    : current?.id === editing.id ? current.questions : []
  if (!questions.length) return <Center>Cargando tu actividad…</Center>
  return (
    <Editor key={editing.id} heading={editing.isNew ? 'Nueva actividad' : 'Editando tu actividad'} titled title={info.title}
      subheading={`${course?.name} · EA${info.ea + 1} · ${info.mechanic === 'choice' ? 'Opción múltiple' : 'Answer Builder'} · Solo tú la ves y la puedes usar.`}
      mechanic={info.mechanic} questions={questions}
      onSave={async (qs, title) => {
        await store.update(root, {
          [`custom/${editing.id}`]: { ...info, title, count: qs.length, updatedAt: store.stamp() },
          [`customQuestions/${editing.id}`]: qs,
        })
        onSelect(editing.id)
      }}
      discardLabel={editing.isNew ? null : 'Eliminar actividad'}
      onDiscard={async () => {
        if (!confirm(`¿Eliminar "${info.title}"? No se puede deshacer.`)) return false
        onSelect(course.eas[info.ea].activities[0].id)
        await store.update(root, { [`custom/${editing.id}`]: null, [`customQuestions/${editing.id}`]: null })
        return true
      }}
      onClose={onClose} />
  )
}

function QuestionImage({ src, className = '' }) {
  return <img src={src} alt="" className={`mx-auto max-w-full rounded-2xl shadow-md object-contain bg-white ${className}`} />
}

/* En pleno juego el QR queda chico en una esquina, por si llega alguien tarde;
   al tocarlo se agranda para escanearlo desde lejos. */
function JoinCorner({ pin }) {
  const joinUrl = `${location.origin}${location.pathname}#/play?pin=${pin}`
  const [qr, setQr] = useState('')
  const [open, setOpen] = useState(false)
  useEffect(() => { QRCode.toDataURL(joinUrl, { margin: 1, width: 720 }).then(setQr) }, [joinUrl])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open])
  if (!qr) return null
  if (open) {
    return (
      <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-900/70 grid place-items-center p-6 cursor-zoom-out">
        <div className="rounded-3xl bg-white p-8 flex flex-col items-center gap-3 text-center shadow-2xl">
          <p className="text-slate-500 font-bold uppercase tracking-widest">Join the game</p>
          <img src={qr} alt="Código QR para unirse" className="w-[min(60vh,80vw)] h-[min(60vh,80vw)]" />
          <p className="text-6xl font-black tracking-[.2em]">{pin}</p>
          <p className="text-slate-500 text-sm">{joinUrl.replace(/^https?:\/\//, '')} · toca para cerrar</p>
        </div>
      </div>
    )
  }
  return (
    <button onClick={() => setOpen(true)} title="Agrandar el código para unirse"
      className="fixed bottom-4 right-4 z-30 flex items-center gap-3 rounded-2xl bg-white/95 border border-slate-200 shadow-lg p-2 pr-4 hover:shadow-xl transition">
      <img src={qr} alt="" className="w-20 h-20" />
      <span className="text-left">
        <span className="block text-xs font-bold uppercase tracking-widest text-slate-500">Join</span>
        <span className="block text-xl font-black tracking-widest">{pin}</span>
        <span className="block text-xs text-[#0F6FD6] font-bold">⤢ Agrandar</span>
      </span>
    </button>
  )
}

function MineBadge() {
  return (
    <span className="inline-block mt-1 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5">
      ✏️ Tu versión
    </span>
  )
}

/* El inicio de sesión solo hace falta para editar. Los errores de configuración
   de Firebase se traducen a lo que el docente tiene que hacer. */
async function signInFriendly(store) {
  try {
    return await store.signIn()
  } catch (e) {
    const why = {
      'auth/popup-closed-by-user': null,
      'auth/cancelled-popup-request': null,
      'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio.',
      'auth/operation-not-allowed': 'Falta activar el inicio de sesión con Google en la consola de Firebase.',
      'auth/unauthorized-domain': 'Falta autorizar este dominio en la consola de Firebase (Authentication → Settings).',
    }[e.code]
    if (why !== null) alert(why ?? `No se pudo iniciar sesión: ${e.message}`)
    return null
  }
}

function Account({ store, user }) {
  if (user === undefined) return null
  if (!user) {
    return (
      <Button variant="ghost" className="!py-2 text-sm" onClick={() => signInFriendly(store)}>
        Iniciar sesión con Google
      </Button>
    )
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      {user.photo && <img src={user.photo} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full" />}
      <span className="font-bold max-w-[10rem] truncate">{user.name}</span>
      <button onClick={() => store.signOut()} className="text-slate-500 hover:underline">Salir</button>
    </span>
  )
}

/* Orden del ranking individual: el mismo al armar los duelos y al dibujarlos. */
function individualRanking(players, scores) {
  return Object.entries(scores)
    .filter(([id]) => players[id])
    .map(([id, s]) => ({ id, name: players[id].name, ...s }))
    .sort((a, b) => b.total - a.total)
}

/* Ranking con duelos: los pares a tiro de una pregunta van enmarcados con su VS,
   arriba se anuncian los adelantamientos y, antes de la última pregunta, el duelo
   por el primer lugar. */
function Leaderboard({ title, rows, board, footnote, onNext }) {
  const shown = rows.slice(0, BOARD_SIZE)
  const duels = board?.duels ? Object.values(board.duels) : []
  const overtakes = board?.overtakes ? Object.values(board.overtakes) : []
  const items = []
  for (let i = 0; i < shown.length; i++) {
    const duel = duels.find((d) => d.place === i + 1 && shown[i + 1])
    if (duel) {
      items.push(
        <li key={shown[i].id} className={`relative rounded-3xl border-[3px] p-1.5 flex flex-col gap-1.5 ${duel.photo ? 'border-rose-500 bg-rose-50' : 'border-orange-400 bg-orange-50'}`}>
          <BoardRow row={shown[i]} place={i + 1} />
          <span className={`absolute right-36 top-1/2 -translate-y-1/2 z-10 rounded-full px-3 py-1 text-base font-black text-white shadow ${duel.photo ? 'bg-rose-600 animate-pulse' : 'bg-orange-500'}`}>
            ⚔️ VS · {duel.gap} pts
          </span>
          <BoardRow row={shown[i + 1]} place={i + 2} />
        </li>,
      )
      i++
    } else {
      items.push(<li key={shown[i].id}><BoardRow row={shown[i]} place={i + 1} /></li>)
    }
  }
  return (
    <section className="max-w-3xl mx-auto flex flex-col gap-5">
      <h2 className="text-4xl font-black text-center">{title}</h2>
      {board?.finalDuel && (
        <div className="rounded-3xl bg-gradient-to-r from-rose-600 to-orange-500 text-white text-center px-6 py-4 shadow-lg animate-rise">
          <p className="text-sm font-black uppercase tracking-[.3em]">⚔️ Final duel · last question!</p>
          <p className="text-3xl font-black">{board.finalDuel.upper.name} <span className="opacity-80">vs</span> {board.finalDuel.lower.name}</p>
          <p className="font-bold">only {board.finalDuel.gap} points apart</p>
        </div>
      )}
      {overtakes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {overtakes.map((o) => (
            <span key={o.who.id} className="rounded-full bg-violet-600 text-white font-black px-4 py-1.5 text-lg shadow animate-rise">
              🔄 {o.who.name} overtook {o.over.name}!
            </span>
          ))}
        </div>
      )}
      <ol className="flex flex-col gap-2">{items}</ol>
      {footnote && <p className="text-center text-slate-500">{footnote}</p>}
      <div className="flex justify-center">
        <Button onClick={onNext}>Siguiente pregunta →</Button>
      </div>
    </section>
  )
}

function BoardRow({ row, place }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl px-5 py-3 text-xl ${row.tint ?? 'bg-white border border-slate-200'}`}>
      <span className="w-8 font-black text-slate-400">{place}</span>
      <span className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-bold truncate">{row.name}</span>
        {row.extra}
      </span>
      {row.gain > 0 && <span className="text-green-600 font-bold">+{row.gain}</span>}
      <span className="w-24 text-right font-black tabular-nums">{row.total}</span>
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

function Reveal({ state, isLast, ranking, image, onNext }) {
  if (state.question.kind === 'choice') return <ChoiceReveal state={state} isLast={isLast} ranking={ranking} image={image} onNext={onNext} />
  const { solution, stats } = state
  const pct = (k) => (stats.answered ? Math.round((stats[k] / stats.answered) * 100) : 0)
  const shown = {
    subject: solution.subject.join(' / '),
    verb: solution.verb.join(' / '),
    wh: WH_TYPES[solution.wh],
  }
  return (
    <section className="flex flex-col gap-8 pt-4">
      {image && <QuestionImage src={image} className="max-h-[22vh]" />}
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
      {state.practice && <PracticePoints ranking={ranking} />}
      <div className="flex justify-center">
        <Button onClick={onNext}>{nextLabel(state, isLast)}</Button>
      </div>
    </section>
  )
}

const nextLabel = (state, isLast) => (state.practice ? '¡Ahora sí, a jugar! →' : isLast ? 'Ver podio 🏆' : 'Ver ranking →')

/* Opción múltiple en el proyector: las alternativas con su color y figura, igual
   que en los celulares. Al revelar se marca la correcta y cuántos eligió cada una. */
/* Answer Builder en el proyector: las mismas opciones (y en el mismo orden) que
   ven los celulares, para que el profesor sepa entre qué están eligiendo. En el
   modo "Escribirlos", sujeto y verbo no tienen opciones: se escriben. */
function BuilderOptions({ question, mode }) {
  const columns = {
    subject: mode === 'write' ? null : question.subjectOptions,
    verb: mode === 'write' ? null : question.verbOptions,
    wh: question.whOptions?.map((k) => WH_TYPES[k]),
  }
  return (
    <div className="grid md:grid-cols-3 gap-3 max-w-5xl w-full mx-auto">
      {PART_KEYS.map((k) => (
        <div key={k} className={`rounded-2xl border-2 bg-white p-3 flex flex-col gap-2 ${ROLES[k].border}`}>
          <RoleTag part={k} className="self-start text-sm px-2 py-0.5" />
          {columns[k]
            ? (
              <div className="flex flex-wrap gap-2">
                {columns[k].map((o) => (
                  <span key={o} className={`rounded-xl border-2 px-3 py-1.5 text-xl font-bold ${ROLES[k].border} ${ROLES[k].text}`}>{o}</span>
                ))}
              </div>
            )
            : <p className="text-lg font-bold text-slate-500">✍️ Students write it</p>}
        </div>
      ))}
    </div>
  )
}

function ChoiceTiles({ options, answer, votes }) {
  const revealed = answer != null
  const total = votes ? votes.reduce((a, b) => a + b, 0) : 0
  return (
    <div className={`grid ${choiceCols(options)} gap-3 max-w-5xl w-full mx-auto`}>
      {options.map((o, i) => {
        const st = CHOICE_STYLES[i]
        const right = o === answer
        return (
          <div key={o}
            className={`relative overflow-hidden rounded-2xl px-5 py-4 flex items-center gap-4 text-white text-2xl md:text-3xl font-bold transition ${st.solid} ${revealed && !right ? 'opacity-35' : ''} ${revealed && right ? 'ring-8 ring-green-300' : ''}`}>
            <span className="text-3xl shrink-0">{st.shape}</span>
            <span className="flex-1">{o}</span>
            {revealed && right && <span className="text-3xl">✓</span>}
            {votes && <span className="rounded-full bg-white/25 px-3 text-xl tabular-nums">{votes[i]}</span>}
            {votes && total > 0 && (
              <span className="absolute left-0 bottom-0 h-1.5 bg-white/70" style={{ width: `${(votes[i] / total) * 100}%` }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ChoiceReveal({ state, isLast, ranking, image, onNext }) {
  const { solution, stats } = state
  const pct = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0
  return (
    <section className="flex flex-col gap-8 pt-4">
      {image && <QuestionImage src={image} className="max-h-[22vh]" />}
      <Prompt text={state.question.prompt} highlightWh={false} className="text-center text-4xl md:text-5xl" />
      <ChoiceTiles options={state.question.options} answer={solution.answer} votes={stats.votes} />
      <p className="text-center text-2xl text-slate-600">
        <b className="text-slate-900">{pct}%</b> correct · {stats.answered} answers
      </p>
      {state.practice && <PracticePoints ranking={ranking} />}
      <div className="flex justify-center">
        <Button onClick={onNext}>{nextLabel(state, isLast)}</Button>
      </div>
    </section>
  )
}

/* Lo que cada uno habría ganado en el simulacro: enseña cómo se puntúa
   (partes correctas × rapidez) sin que cuente para el juego. */
function PracticePoints({ ranking }) {
  const list = [...ranking].sort((a, b) => b.gain - a.gain)
  return (
    <div className="max-w-2xl w-full mx-auto rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50 p-5">
      <p className="text-center font-bold text-violet-800 mb-3">
        Practice points — they don’t count. The real game starts at 0!
      </p>
      <ol className="flex flex-wrap justify-center gap-2">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-full bg-white border border-violet-200 pl-3 pr-2 py-1">
            <span className="font-bold">{p.name}</span>
            <span className="rounded-full bg-violet-600 text-white text-sm font-black px-2 tabular-nums">+{p.gain || 0}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* Festejo del campeón, ~7 s: estallido dorado con estrellas, cañones de confeti
   desde las esquinas de abajo y fuegos artificiales en el cielo.
   No respeta "reducir movimiento" a propósito: es el proyector de la sala, un
   festejo pedido por el profesor, y los PC de aula suelen traer las animaciones
   de Windows apagadas (con eso el confeti no salía). */
function celebrate() {
  const opts = { zIndex: 50 }
  const gold = ['#facc15', '#fde68a', '#f59e0b', '#ffffff']
  const party = ['#f43f5e', '#3b82f6', '#22c55e', '#facc15', '#a855f7', '#f97316']
  const cannons = () => {
    confetti({ ...opts, particleCount: 70, angle: 60, spread: 60, startVelocity: 70, origin: { x: 0, y: 1 }, colors: party })
    confetti({ ...opts, particleCount: 70, angle: 120, spread: 60, startVelocity: 70, origin: { x: 1, y: 1 }, colors: party })
  }
  confetti({ ...opts, particleCount: 180, spread: 110, startVelocity: 55, origin: { x: 0.5, y: 0.5 }, colors: gold })
  confetti({ ...opts, particleCount: 40, spread: 140, startVelocity: 45, origin: { x: 0.5, y: 0.5 }, colors: gold, shapes: ['star'], scalar: 1.6 })
  cannons()
  const timers = [setTimeout(cannons, 900), setTimeout(cannons, 1800)]

  const end = Date.now() + 7000
  const id = setInterval(() => {
    if (Date.now() > end) return clearInterval(id)
    const colors = Math.random() < 0.35 ? gold : [party[Math.floor(Math.random() * party.length)], '#ffffff']
    confetti({
      ...opts, particleCount: 60, spread: 360, startVelocity: 28, ticks: 80, gravity: 0.7, decay: 0.92, colors,
      shapes: Math.random() < 0.3 ? ['star'] : ['circle'],
      origin: { x: 0.1 + Math.random() * 0.8, y: 0.08 + Math.random() * 0.3 },
    })
  }, 280)
  return () => { clearInterval(id); timers.forEach(clearTimeout); confetti.reset() }
}

const PLACES = {
  1: { medal: '🥇', pedestal: 'h-56 bg-gradient-to-b from-yellow-300 to-amber-500 text-amber-900', width: 'w-60' },
  2: { medal: '🥈', pedestal: 'h-40 bg-gradient-to-b from-slate-200 to-slate-400 text-slate-700', width: 'w-44' },
  3: { medal: '🥉', pedestal: 'h-28 bg-gradient-to-b from-orange-300 to-orange-500 text-orange-900', width: 'w-44' },
}

function CountUp({ to, ms = 1200 }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let frame
    const step = (t) => {
      const k = Math.min(1, (t - start) / ms)
      setValue(Math.round(to * (1 - (1 - k) ** 3))) // frena al llegar
      if (k < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [to, ms])
  return value
}

function Podium({ ranking, mvp, stage, onAgain }) {
  const shown = { 1: stage.first, 2: stage.second, 3: stage.third }

  // Solo si el primero aparece ahora (no al recargar la página mucho después).
  const celebrated = useRef(false)
  useEffect(() => {
    if (!stage.first || stage.rest || celebrated.current) return
    celebrated.current = true
    return celebrate()
  }, [stage.first])

  const column = (place) => {
    const p = ranking[place - 1]
    const style = PLACES[place]
    const champion = place === 1
    const waiting = !shown[place] && p
    return (
      <div className={`flex flex-col items-center justify-end gap-2 ${style.width}`}>
        {p && shown[place] && (
          <div className={`flex flex-col items-center gap-1 w-full ${champion ? 'animate-champion' : 'animate-rise'}`}>
            {champion && <span className="text-5xl -mb-2">👑</span>}
            <span className={champion ? 'text-7xl' : 'text-5xl'}>{style.medal}</span>
            <span className={`font-black text-center truncate w-full ${champion ? 'text-4xl' : 'text-2xl'}`}>{p.name}</span>
            {/* Los puntos llegan al final, todos a la vez, para comparar las
                distancias sin adelantar quién ganó. El espacio queda reservado. */}
            <span className={`font-bold tabular-nums text-slate-600 ${champion ? 'text-2xl' : 'text-lg'}
              ${stage.rest ? 'animate-rise' : 'invisible'}`}>
              {stage.rest ? <CountUp to={p.total} /> : 0} pts
            </span>
          </div>
        )}
        <div className={`w-full rounded-t-3xl grid place-items-center font-black shadow-lg ${style.pedestal}
          ${champion && shown[1] ? 'animate-glow' : ''}`}>
          <span className={`text-6xl ${waiting ? 'animate-pulse opacity-60' : ''}`}>
            {waiting ? '?' : place}
          </span>
        </div>
      </div>
    )
  }

  return (
    <section className="flex flex-col items-center gap-8 pt-2">
      <h2 className="text-4xl font-black">
        {stage.first ? '🎉 And the winner is… 🎉' : stage.drumroll ? 'And the winner is…' : 'Final results'}
      </h2>
      <div className="flex items-end gap-3 min-h-[26rem]">
        {column(2)}
        {column(1)}
        {column(3)}
      </div>
      {stage.rest && ranking.length > 3 && (
        <ol start={4} className="w-full max-w-xl flex flex-col gap-1 animate-rise">
          {ranking.slice(3).map((p, i) => (
            <li key={p.id} className="flex gap-4 rounded-xl bg-white border border-slate-200 px-4 py-2">
              <span className="w-6 text-slate-400 font-bold">{i + 4}</span>
              <span className="flex-1 font-bold truncate">{p.name}</span>
              <span className="tabular-nums font-bold">{p.total}</span>
            </li>
          ))}
        </ol>
      )}
      {stage.rest && mvp && (
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-amber-100 to-yellow-50 border-2 border-amber-300 px-6 py-3 animate-rise">
          <span className="text-5xl">⭐</span>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-amber-700">MVP · best player</p>
            <p className="text-3xl font-black">{mvp.name} <span className="text-xl font-bold text-slate-600 tabular-nums">· {mvp.total} pts</span></p>
          </div>
        </div>
      )}
      {stage.rest && <Button onClick={onAgain} className="animate-rise">Jugar otra vez</Button>}
    </section>
  )
}
