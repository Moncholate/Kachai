import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { isOnline } from '../net/store.js'
import { useNow, useStore, useUser, useValue } from '../net/hooks.js'
import { ACTIVITY_TYPES, COURSES, LEVELS, SETS, courseOf, getSet, sameTypeIn } from '../game/sets.js'
import { DOUBLE, STREAK_MIN, answerProgress, buildPublicQuestion, playOrder, playedQuestions, historyEntry, historyKey, isChoice, reviewQuestion, checkAnswer, nextStreak, scoreFor, solutionOf } from '../game/logic.js'
import { Button, CHOICE_STYLES, Center, ChoiceLetter, Logo, PART_KEYS, Prompt, ROLES, RoleTag, StreakBadge, StreakName, TimerBar, choiceCols } from '../ui.jsx'
import { answeringTrack, getSound } from './sound.js'
import Editor, { blankQuestion } from './Editor.jsx'
import ClassReport from './ClassReport.jsx'
import { buildReport } from '../game/report.js'
import {
  applyLibrary, customIndexPath, customQuestionsPath, customSet, isCustomId, libraryPath, newCustomId,
} from '../game/library.js'
import { PODIUM_SOUNDS, podiumStage } from '../game/podium.js'
import { BOARD_SIZE, DUEL_GAP, buildBoard, previousTotals } from '../game/duels.js'
import {
  MAX_TEAMS, TEAM_MAX, TEAM_MIN, makeTeams, membersOf, mvpOf, presetOf, shuffleIntoTeams, smallestTeam,
  suggestTeamCount, teamIdsOf, teamRanking,
} from '../game/teams.js'
import confetti from 'canvas-confetti'
import { IDIOMA_POR_DEFECTO, ProveedorIdioma, SelectorIdioma, nombreEquipo, traducir, useT, valido } from '../i18n.jsx'
import { BotonTema, useTema } from '../tema.jsx'

/* El navegador del profesor es el "servidor" de la actividad: baraja, lleva el
   cronómetro, corrige y reparte puntos. La base de datos solo transporta. Todo el
   estado vive en la base, así que recargar esta pestaña retoma la partida. */

const PIN_KEY = 'kachai-host-pin'
const savedPin = {
  get() { try { return sessionStorage.getItem(PIN_KEY) } catch { return null } },
  set(v) { try { v ? sessionStorage.setItem(PIN_KEY, v) : sessionStorage.removeItem(PIN_KEY) } catch { /* sin storage */ } },
}

/* El último idioma que eligió el docente en este navegador: la sala nueva parte
   con él. */
export const IDIOMA_KEY = 'kachai-idioma'
export const idiomaGuardado = () => {
  try { return valido(localStorage.getItem(IDIOMA_KEY) || IDIOMA_POR_DEFECTO) } catch { return IDIOMA_POR_DEFECTO }
}

/* "Mezclar preguntas" también se recuerda en este navegador. */
const MEZCLAR_KEY = 'kachai-mezclar'
const mezclarGuardado = () => { try { return localStorage.getItem(MEZCLAR_KEY) === '1' } catch { return false } }

/* Margen tras el cero para que alcance a llegar una respuesta enviada en el último segundo. */
const GRACE_MS = 800

async function openRoom(store) {
  const saved = savedPin.get()
  if (saved && (await store.get(`rooms/${saved}/meta`))) return saved
  let pin
  do pin = String(100000 + Math.floor(Math.random() * 900000))
  while (await store.get(`rooms/${pin}/meta`))
  await store.update(`rooms/${pin}`, {
    meta: { createdAt: store.stamp(), setId: SETS[0].id, mode: 'select', readSec: 8, answerSec: 30, lang: idiomaGuardado(), shuffle: mezclarGuardado() },
    state: { phase: 'lobby', round: 0 },
  })
  savedPin.set(pin)
  return pin
}

export default function Host() {
  const tema = useTema('kachai-tema-proyector', 'claro')
  const store = useStore()
  const [pin, setPin] = useState(null)
  const [error, setError] = useState(null)
  const opening = useRef(false)

  useEffect(() => {
    if (!store || opening.current) return
    opening.current = true
    openRoom(store).then(setPin, (e) => setError(e.message))
  }, [store])

  if (error) return <Center>{traducir(idiomaGuardado(), 'noSeCreo', error)}</Center>
  if (!pin) return <Center>{traducir(idiomaGuardado(), 'creandoSala')}</Center>
  return <HostRoom store={store} pin={pin} tema={tema} />
}

function HostRoom({ store, pin, tema }) {
  const base = `rooms/${pin}`
  const meta = useValue(store, `${base}/meta`)
  /* Todo el proyector, también los controles, va en el idioma de la sala. */
  const idioma = valido(meta?.lang)
  const t = (clave, ...args) => traducir(idioma, clave, ...args)
  const state = useValue(store, `${base}/state`)
  const players = useValue(store, `${base}/players`) || {}
  const online = useValue(store, `${base}/online`) || {}
  const scores = useValue(store, `${base}/scores`) || {}
  const inGame = state?.qIndex != null && state.phase !== 'lobby'
  const answers = useValue(store, inGame ? `${base}/answers/${state.qIndex}` : null) || {}
  /* Cada 100 ms y no 200: en el podio cada puesto tiene que aparecer junto con el
     golpe de su fanfarria, y 200 ms de atraso ya se notaban. */
  const now = useNow(store, 100)
  const fired = useRef('')
  const user = useUser(store)
  /* Biblioteca personal: sus versiones editadas reemplazan a las originales. */
  const library = useValue(store, user ? libraryPath(user.uid) : null) || {}
  const [editing, setEditing] = useState(null)
  /* Resumen del curso: se abre desde el podio, y el del último juego sigue
     disponible en el lobby después de "Jugar otra vez" (que borra los puntajes). */
  const [reportOpen, setReportOpen] = useState(false)
  const [lastReport, setLastReport] = useState(null)

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
  /* Con "Mezclar preguntas", el orden sorteado al empezar (state.order). La
     práctica no entra: va siempre primero. */
  const played = set ? playedQuestions(set.questions, state?.order) : []
  const questionAt = (i) => (i < 0 ? set.practice : played[i])
  const current = set && inGame ? questionAt(state.qIndex) : null
  const progress = answerProgress(players, online, answers)
  const activeIds = progress.active
  const teamMode = meta?.teamMode === 'teams'
  /* Los nombres de equipo en el idioma de la sala (si el profesor no los cambió):
     así salen traducidos en el ranking, los duelos y el podio. */
  const teams = useMemo(() => Object.fromEntries(Object.entries(meta?.teams || {})
    .map(([id, tm]) => [id, { ...tm, name: nombreEquipo(t, id, tm) }])), [meta?.teams, idioma])
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
  const answeredCount = progress.answered

  /* La hora de inicio de cada fase la fija el proyector con store.now() (su reloj
     ya alineado al del servidor), NO con store.stamp(). Con stamp, Firebase
     entrega primero una estimación y al rato la corrige hacia adelante en lo que
     tardó la red: el cronómetro saltaba un segundo hacia arriba al empezar, y en
     el podio los nombres salían tarde respecto de los redobles, que ya se habían
     programado con la estimación. Con WiFi de colegio el salto se notaba. */
  const goQuestion = (i, round = state.round, extra = {}, order = state.order ?? null, double = false) => {
    const q = i < 0 ? set.practice : playedQuestions(set.questions, order)[i]
    return store.update(base, {
      ...extra,
      state: {
        phase: 'reading', round, qIndex: i, total: set.questions.length, practice: i < 0, order, double,
        question: buildPublicQuestion(q), startedAt: store.now(),
      },
    })
  }
  const withPractice = meta?.practice !== false && Boolean(set?.practice)
  const start = () => goQuestion(withPractice ? -1 : 0, (state.round || 0) + 1, { answers: null, scores: null, ...fillTeams() },
    playOrder(set.questions.length, meta.shuffle === true))
  /* Tras el simulacro todos vuelven a 0: sus puntos solo se mostraron. */
  const startForReal = () => goQuestion(0, state.round, { answers: null, scores: null })
  const startAnswering = () => store.update(`${base}/state`, { phase: 'answering', startedAt: store.now() })
  const isLast = !state?.practice && state?.qIndex + 1 >= set?.questions.length
  const beforeLast = !state?.practice && state?.qIndex + 2 === set?.questions.length
  /* Al abrir el ranking se arma el tablero de duelos (ver game/duels.js) y se
     publica: proyector y celulares muestran los mismos VS. */
  const rankingNow = () => (teamMode ? teamRanking(teams, players, scores) : individualRanking(players, scores))
  const showRanking = () => {
    const now = rankingNow()
    store.update(`${base}/state`, { phase: 'leaderboard', nextDouble: false, board: buildBoard(now, previousTotals(now), beforeLast) })
  }
  /* 2X: se activa en el ranking antes de la última pregunta. El tablero se
     vuelve a armar con el doble de alcance: más puestos quedan "a tiro". */
  const toggleDouble = () => {
    const on = !state.nextDouble
    const now = rankingNow()
    if (on) getSound().effect('double')
    store.update(`${base}/state`, {
      nextDouble: on, board: buildBoard(now, previousTotals(now), true, on ? DUEL_GAP * DOUBLE : DUEL_GAP),
    })
  }
  /* Tras la última pregunta no hay ranking: se salta directo al podio, que se
     revela por partes (ver game/podium.js) para mantener el suspenso. */
  /* Con el podio se publican las preguntas con sus soluciones: ya terminó el
     juego, y cada celular arma con ellas el resumen de su alumno. */
  const showPodium = () => store.update(`${base}/state`, {
    phase: 'end', startedAt: store.now(), review: played.map(reviewQuestion),
  })
  const next = () => (isLast ? showPodium() : goQuestion(state.qIndex + 1, state.round, {}, state.order ?? null, Boolean(beforeLast && state.nextDouble)))
  const backToLobby = () => {
    if (set) setLastReport({ report: buildReport(played, players, scores, (k) => t(`wh_${k}`)), title: activityLabel(set) })
    setReportOpen(false)
    return store.update(base, { answers: null, scores: null, state: { phase: 'lobby', round: state.round || 0 } })
  }
  const kick = (id) => store.update(base, { [`players/${id}`]: null, [`scores/${id}`]: null, [`online/${id}`]: null })
  const closeRoom = async () => {
    if (!confirm(t('confirmarCerrar'))) return
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
          gain = scoreFor(parts, elapsed, answerMs) * (state.double ? DOUBLE : 1)
        }
        stats.answered++
        if (choice) {
          const i = state.question.options.indexOf(a.choice)
          if (i >= 0) stats.votes[i]++
          if (parts[0]) stats.correct++
        } else {
          PART_KEYS.forEach((k, i) => { if (parts[i]) stats[k]++ })
        }
        if (parts.every(Boolean)) stats.full = (stats.full || 0) + 1
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
      if (timeUp || progress.everyone) {
        fired.current = key
        reveal()
      }
    }
  })

  /* Música por fase. La lectura va en silencio para concentrarse; el tema de
     responder arranca con el cronómetro. Revelar y ranking tampoco llevan música. */
  const stage = podiumStage(state?.phase === 'end' ? state.startedAt : null, now)
  // En el podio la música la pone el guion de abajo (la fanfarria larga entra con el 1.º).
  /* La última pregunta tiene su tema propio (Final Question), haya 2X o no. */
  const track = state?.phase === 'end' ? null
    : state?.phase === 'answering' && isLast ? 'final'
    : ({ lobby: 'lobby', answering: answeringTrack(state?.round, state?.qIndex) }[state?.phase] ?? null)
  useEffect(() => { getSound().play(track) }, [track])
  useEffect(() => () => { getSound().play(null) }, [])

  /* Sonidos del podio (ver PODIUM_SOUNDS): redobles, mini fanfarrias y la larga.
     Se programan UNA vez por juego (clave: la ronda). Antes la clave incluía la
     hora de inicio, que Firebase primero estima y luego corrige: al corregirse se
     reprogramaba todo y lo ya sonado se repetía encima. */
  const podiumRound = state?.phase === 'end' && typeof state.startedAt === 'number' ? state.round : null
  const scheduledPodium = useRef(null)
  const podiumTimers = useRef([])
  useEffect(() => {
    if (podiumRound == null || scheduledPodium.current === podiumRound) return
    scheduledPodium.current = podiumRound
    const elapsed = store.now() - state.startedAt
    const sound = getSound()
    podiumTimers.current = PODIUM_SOUNDS
      .filter((cue) => cue.at >= elapsed - 150) // al recargar en pleno podio no se repite lo ya sonado
      .map((cue) => setTimeout(() => {
        if (cue.effect) sound.effect(cue.effect)
        if (cue.music) sound.play(cue.music)
      }, Math.max(0, cue.at - elapsed)))
  }, [podiumRound])
  // Al salir del podio (Jugar otra vez, cerrar sala) se cancela lo pendiente.
  useEffect(() => {
    if (state?.phase === 'end') return
    podiumTimers.current.forEach(clearTimeout)
    podiumTimers.current = []
  }, [state?.phase])

  /* Un efecto al entrar en cada fase clave, una vez por pregunta. */
  const phaseEffect = { reading: 'question', reveal: 'reveal', leaderboard: 'ranking' }[state?.phase]
  const phaseKey = state ? `${state.round}-${state.qIndex}-${state.phase}` : null
  const lastEffect = useRef(null)
  useEffect(() => {
    if (!phaseEffect || lastEffect.current === phaseKey) return
    lastEffect.current = phaseKey
    const sound = getSound()
    sound.effect(phaseEffect)
    const later = (ms, name) => setTimeout(() => sound.effect(name), ms)
    /* Revelar: el público reacciona según cómo le fue al curso, después del
       remate del efecto de revelar (~1,7 s). Entre 40 y 70 %, silencio. */
    if (state.phase === 'reveal' && state.stats?.answered) {
      const rate = (state.stats.full || 0) / state.stats.answered
      if (rate >= 0.7) later(1800, 'crowdYes')
      else if (rate < 0.4) later(1800, 'crowdNo')
    }
    /* Ranking: 🔄 si alguien adelantó a su rival, y luego ⚔️ si hay duelos. */
    /* (Sin duelos ni adelantamientos Firebase no guarda el tablero: puede no existir.) */
    if (state.phase === 'leaderboard') {
      const overtook = Object.keys(state.board?.overtakes || {}).length > 0
      if (overtook) later(300, 'overtake')
      const dueled = Object.keys(state.board?.duels || {}).length > 0
      if (dueled) later(overtook ? 900 : 400, 'duel')
      // 🔥 alguien llegó a 3 seguidas (fuego) o a 5, 10… (estrella)
      const milestone = Object.values(scores).some((s) => s.streak === STREAK_MIN || (s.streak >= 5 && s.streak % 5 === 0))
      if (milestone) later(overtook || dueled ? 1500 : 500, 'streak')
    }
  }, [phaseKey, phaseEffect])

  const secondsLeft = state?.phase === 'answering' && meta && typeof state.startedAt === 'number'
    ? Math.min(meta.answerSec, Math.ceil((state.startedAt + meta.answerSec * 1000 - now) / 1000))
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
    /* ⏰ Justo al llegar a cero. La revelación espera después un margen (GRACE_MS)
       por las respuestas enviadas en el último segundo; la bocina no lo espera. */
    if (secondsLeft <= 0 && lastTick.current !== 0) {
      lastTick.current = 0
      getSound().effect('timesUp')
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
        <p className="mb-4">{t('salaNoExiste')}</p>
        <Button onClick={() => { savedPin.set(null); location.reload() }}>{t('crearOtraSala')}</Button>
      </Center>
    )
  }
  if (!meta || !state) return <Center>{t('cargandoSala')}</Center>

  const ranking = individualRanking(players, scores)
  const teamRank = teamMode ? teamRanking(teams, players, scores) : null
  /* Pregunta y revelar caben en la ventana, sin bajar: la página mide lo mismo
     que la pantalla y la imagen se queda con el espacio que sobra. Margen de
     lg:px-28 a los lados: ahí vive el QR chico de la esquina (JoinCorner). */
  const fit = ['reading', 'answering', 'reveal'].includes(state.phase)

  return (
    <ProveedorIdioma value={idioma}>
    <div className={`flex flex-col ${fit ? 'h-dvh' : 'min-h-screen'}`}>
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 bg-white border-b border-slate-200">
        <Logo className="text-2xl" />
        <span className="text-slate-500">{t('pin')} <b className="text-slate-900 tracking-widest">{pin}</b></span>
        <span className="text-slate-500">{t('conectados', activeIds.length)}</span>
        {inGame && (state.practice
          ? <span className="rounded-full bg-violet-100 text-violet-800 text-xs font-bold px-3 py-1">{t('practicaNoSuma')}</span>
          : <span className="text-slate-500">{t('preguntaDe', state.qIndex + 1, state.total)}</span>)}
        {inGame && state.double && <span className="rounded-full bg-amber-400 text-amber-950 text-xs font-black px-3 py-1">{t('dobleCorto')}</span>}
        {!isOnline && (
          <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1">
            {t('modoLocal')}
          </span>
        )}
        <SoundControl className="ml-auto" />
        <BotonTema tema={tema} etiqueta={tema.oscuro ? t('usarClaro') : t('usarOscuro')} />
        {isOnline && <Account store={store} user={user} />}
        <Button variant="danger" className="!py-2 text-sm" onClick={closeRoom}>{t('cerrarSala')}</Button>
      </header>
      {inGame && state.phase !== 'end' && <div className="relative"><JoinCorner pin={pin} /></div>}

      <main className={`flex-1 w-full mx-auto ${fit ? 'min-h-0 overflow-y-auto max-w-[110rem] px-6 lg:px-28 py-4 flex flex-col' : 'max-w-6xl p-6'}`}>
        {state.phase === 'lobby' && editing && user && (
          <ActivityEditor store={store} user={user} editing={editing} library={library} customIndex={customIndex}
            current={set} onSelect={(setId) => store.update(`${base}/meta`, { setId })} onClose={() => setEditing(null)} />
        )}
        {state.phase === 'lobby' && !editing && reportOpen && lastReport && (
          <ClassReport report={lastReport.report} title={lastReport.title} closeLabel={t('volverLobby')} onClose={() => setReportOpen(false)} />
        )}
        {state.phase === 'lobby' && !editing && !(reportOpen && lastReport) && (
          <Lobby store={store} base={base} pin={pin} meta={meta} teams={teams} players={players} online={online}
            set={set} setReady={setReady} user={user} library={library} customIndex={customIndex}
            onKick={kick} onStart={start} onLastReport={lastReport ? () => setReportOpen(true) : null}
            onEdit={async (id) => {
              if (!user && !(await signInFriendly(store, idioma))) return
              setEditing(isCustomId(id) ? { kind: 'custom', id, info: customIndex[id] } : { kind: 'base', id })
            }}
            onCreate={async (info) => {
              if (!user && !(await signInFriendly(store, idioma))) return
              setEditing({ kind: 'custom', id: newCustomId(), info, isNew: true })
            }} />
        )}

        {(state.phase === 'reading' || state.phase === 'answering') && current?.image && state.question.kind === 'choice' && (
          <PictureLayout src={current.image}>
            <p className="text-center text-base font-bold uppercase tracking-widest text-slate-500">
              {state.practice && <span className="block text-violet-600">{t('preguntaPractica')}</span>}
              {state.double && <DoubleBanner />}
              {state.phase === 'reading' ? t('leeLaPregunta') : t('respondeCelular')}
            </p>
            <Prompt text={state.question.prompt} highlightWh={false} className="text-center text-4xl xl:text-5xl" />
            <TimerBar
              start={state.startedAt}
              ms={(state.phase === 'reading' ? meta.readSec : meta.answerSec) * 1000}
              now={now}
              className="w-full"
            />
            {state.phase === 'answering' && <ChoiceTiles options={state.question.options} compact stacked />}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {state.phase === 'answering' && (
                <p className="text-xl text-slate-600">
                  <b className="text-slate-900 text-3xl tabular-nums">{answeredCount}</b>{t('respondieronDe', activeIds.length)}
                </p>
              )}
              <Button variant="ghost" className="!py-2" onClick={state.phase === 'reading' ? startAnswering : () => { getSound().effect('timesUp'); reveal() }}>
                {state.phase === 'reading' ? t('saltarLectura') : t('terminarTiempo')}
              </Button>
            </div>
          </PictureLayout>
        )}
        {(state.phase === 'reading' || state.phase === 'answering') && !(current?.image && state.question.kind === 'choice') && (
          <section className={`flex-1 min-h-0 flex flex-col ${current?.image ? 'gap-3' : 'gap-8'}`}>
            <p className="text-center text-base font-bold uppercase tracking-widest text-slate-500">
              {state.practice && <span className="block text-violet-600">{t('preguntaPractica')}</span>}
              {state.double && <DoubleBanner />}
              {state.phase === 'reading' ? t('leeLaPregunta') : t('respondeCelular')}
            </p>
            {/* La imagen se queda con todo el alto que sobra: más grande al leer,
                y al responder cede lo justo para que entren las alternativas. */}
            {current?.image ? <QuestionImage src={current.image} /> : <div className="flex-1" />}
            <Prompt text={state.question.prompt} highlightWh={state.question.kind !== 'choice'}
              className={`text-center ${current?.image ? 'text-4xl lg:text-5xl' : 'text-4xl lg:text-6xl'}`} />
            <TimerBar
              start={state.startedAt}
              ms={(state.phase === 'reading' ? meta.readSec : meta.answerSec) * 1000}
              now={now}
              className="max-w-3xl w-full mx-auto"
            />
            {state.phase === 'answering' && (state.question.kind === 'choice'
              ? <ChoiceTiles options={state.question.options} compact={Boolean(current?.image)} />
              : <BuilderOptions question={state.question} mode={meta.mode} />)}
            {!current?.image && <div className="flex-1" />}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {state.phase === 'answering' && (
                <p className="text-xl text-slate-600">
                  <b className="text-slate-900 text-3xl tabular-nums">{answeredCount}</b>{t('respondieronDe', activeIds.length)}
                </p>
              )}
              <Button variant="ghost" className="!py-2" onClick={state.phase === 'reading' ? startAnswering : () => { getSound().effect('timesUp'); reveal() }}>
                {state.phase === 'reading' ? t('saltarLectura') : t('terminarTiempo')}
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
            double={beforeLast ? { on: Boolean(state.nextDouble), onToggle: toggleDouble } : null}
            title={teamMode ? t('rankingEquipos') : t('ranking')}
            footnote={teamMode ? t('notaEquipos') : null}
            rows={teamMode
              ? teamRank.map((tm) => ({ ...tm, tint: `${presetOf(tm.id).tint} ${presetOf(tm.id).border} border-2`, extra: <span className="text-base font-normal text-slate-500">· {tm.members.length}</span> }))
              : ranking.map((p) => ({ ...p, extra: <StreakBadge streak={p.streak} className="text-base shrink-0" /> }))} />
        )}

        {state.phase === 'end' && reportOpen && (
          <ClassReport report={buildReport(played, players, scores, (k) => t(`wh_${k}`))} title={activityLabel(set)}
            closeLabel={t('volverPodio')} onClose={() => setReportOpen(false)} />
        )}
        {state.phase === 'end' && !reportOpen && (
          <Podium ranking={teamRank ?? ranking} mvp={teamMode ? mvpOf(players, scores) : null} stage={stage}
            onAgain={backToLobby} onReport={() => setReportOpen(true)} />
        )}
      </main>

    </div>
    </ProveedorIdioma>
  )
}

function Lobby({ store, base, pin, meta, teams, players, online, set, setReady, user, library, customIndex, onKick, onStart, onEdit, onCreate, onLastReport }) {
  const t = useT()
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

  const students = (
    <ul className="flex flex-wrap gap-1.5">
      {list.map(([id, p]) => (
        <li key={id}
          className={`group flex items-center gap-1 rounded-full pl-3 pr-1 py-0.5 text-sm font-bold border ${online[id] === false ? 'text-slate-400 border-dashed border-slate-300' : 'bg-slate-100 border-slate-200'}`}>
          {p.name}
          <button onClick={() => onKick(id)} title={t('expulsar')}
            className="w-6 h-6 rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-700">×</button>
        </li>
      ))}
    </ul>
  )
  const selected = (on) => (on ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200 hover:border-slate-300')

  /* Izquierda, fija al bajar: lo que mira la sala (QR y PIN), quiénes entraron
     y el botón de empezar. Derecha: qué se juega y cómo. */
  return (
    <div className="grid lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] gap-5 items-start">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        <section className="rounded-3xl bg-white border border-slate-200 p-5 flex flex-col items-center text-center gap-1.5">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('unirseJuego')}</p>
          {qr && <img src={qr} alt={t('qrUnirse')} className="w-44 h-44" />}
          <p className="text-slate-500 break-all text-xs">{joinUrl.replace(/^https?:\/\//, '')}</p>
          <p className="text-slate-500 text-sm mt-1">{t('pinJuego')}</p>
          <p className="text-[2.75rem] leading-none font-black tracking-[.15em] text-slate-900">{pin}</p>
        </section>

        <section className="rounded-3xl bg-white border border-slate-200 p-4">
          <p className="font-bold mb-2">{t('alumnosN', list.length)}</p>
          {list.length === 0 && <p className="text-sm text-slate-400">{t('esperandoUnan')}</p>}
          {teamMode ? <p className="text-sm text-slate-500">{t('verEquiposAbajo')}</p> : students}
        </section>

        {/* Cómo se juega: una fila por ajuste, rótulo a la izquierda. */}
        <section className="rounded-3xl bg-white border border-slate-200 px-4 py-3 flex flex-col divide-y divide-slate-100">
          <SettingRow label={t('ordenPreguntas')}>
            <Segmented value={meta.shuffle === true} onChange={(shuffle) => {
              setMeta({ shuffle })
              try { localStorage.setItem(MEZCLAR_KEY, shuffle ? '1' : '0') } catch { /* modo privado */ }
            }} options={[[false, t('enOrden')], [true, t('mezcladas')]]} />
          </SettingRow>
          <SettingRow label={t('modoJuego')}>
            <Segmented value={teamMode ? 'teams' : 'solo'} onChange={setTeamMode}
              options={[['solo', t('individual')], ['teams', t('equipos')]]} />
          </SettingRow>
          <SettingRow label={t('tiempoLectura')}>
            <Segmented value={meta.readSec} onChange={(readSec) => setMeta({ readSec })}
              options={[[5, '5 s'], [8, '8 s'], [12, '12 s']]} />
          </SettingRow>
          <SettingRow label={t('tiempoResponder')}>
            <Segmented value={meta.answerSec} onChange={(answerSec) => setMeta({ answerSec })}
              options={[[20, '20'], [30, '30'], [45, '45'], [60, '60 s']]} />
          </SettingRow>
          {set.practice && (
            <SettingRow label={t('practicaCorto')}>
              <Segmented value={meta.practice !== false} onChange={(practice) => setMeta({ practice })}
                options={[[true, t('si')], [false, t('no')]]} />
            </SettingRow>
          )}
          {(set.type === 'answer-builder' || set.mechanic === 'builder') && (
            <SettingRow label={t('sujetoYVerbo')}>
              <Segmented value={meta.mode} onChange={(mode) => setMeta({ mode })}
                options={[['select', t('elegirCorto')], ['write', t('escribirlos')]]} />
            </SettingRow>
          )}
        </section>

        {!setReady && (
          <p className="text-center text-sm font-bold text-amber-700">
            {user ? t('cargandoActividad') : t('iniciaSesionActividad')}
          </p>
        )}
        <Button className="text-xl py-3.5" disabled={list.length === 0 || !setReady} onClick={onStart}>
          {t('comenzar')}
        </Button>
        {onLastReport && (
          <button onClick={onLastReport} className="self-center text-sm font-bold text-[#0F6FD6] hover:underline">
            {t('verUltimoResumen')}
          </button>
        )}
      </aside>

      <section className="flex flex-col gap-4 min-w-0">
        <div className="rounded-3xl bg-white border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-500">{t('idiomaSala')}</p>
              <p className="text-xs text-slate-400">{t('idiomaAyuda')}</p>
            </div>
            <SelectorIdioma idioma={t.idioma} onCambiar={(lang) => {
              setMeta({ lang })
              try { localStorage.setItem(IDIOMA_KEY, lang) } catch { /* modo privado */ }
            }} />
          </div>
          <Field label={t('curso')}>
            <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1.5 items-center">
              {LEVELS.map((level) => (
                <Fragment key={level}>
                  <span className="text-sm font-bold text-slate-500 pr-2">{level}</span>
                  {COURSES.filter((c) => c.level === level).map((c) => (
                    <button key={c.id} onClick={() => setMeta({ setId: sameTypeIn(c.eas[eaIndex], set.type).id })}
                      className={`min-w-0 rounded-lg border-2 px-1 py-1 text-sm font-bold transition ${selected(course.id === c.id)}`}>
                      {c.label}
                    </button>
                  ))}
                </Fragment>
              ))}
            </div>
          </Field>
          <Field label={t('experiencia', course.book)}>
            <div className="grid sm:grid-cols-2 gap-2">
              {course.eas.map((e) => (
                <button key={e.ea} onClick={() => setMeta({ setId: sameTypeIn(e, set.type).id })}
                  className={`rounded-xl border-2 px-3 py-2 text-left transition ${selected(ea === e)}`}>
                  <span className="block text-sm font-bold">{e.ea} <span className="font-normal text-slate-500">· {e.files}</span></span>
                  <span className="block text-xs text-slate-500">{e.topics}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label={t('actividad')}>
            <div className="grid sm:grid-cols-2 gap-2">
              {ea.activities.filter((a) => a.type !== 'grammar-focus').map((a) => (
                <button key={a.id} onClick={() => setMeta({ setId: a.id })} title={t(`desc_${a.type.replace(/-/g, '_')}`)}
                  className={`rounded-xl border-2 px-3 py-2 text-left transition ${selected(set.id === a.id)}`}>
                  <span className="block text-sm font-bold">
                    {a.title} <span className="font-normal text-slate-500">· {t('nPreguntas', count(a))}</span>
                  </span>
                  {mine(a) && <MineBadge />}
                  <span className="block text-xs text-slate-500 line-clamp-2">{t(`desc_${a.type.replace(/-/g, '_')}`)}</span>
                </button>
              ))}
            </div>
            {/* Los Grammar Focus pueden ser muchos (el intensivo junta dos cursos): van como lista compacta de temas. */}
            {focusList.length > 0 && (
              <div className={`mt-2 rounded-xl border-2 px-3 py-2 transition ${set.type === 'grammar-focus' ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200'}`}>
                <p className="text-sm font-bold">
                  {ACTIVITY_TYPES['grammar-focus'].name}
                  <span className="font-normal text-slate-500">{t('unContenido', focusList[0].questions.length)}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {focusList.map((a) => (
                    <button key={a.id} onClick={() => setMeta({ setId: a.id })}
                      className={`rounded-full border px-2.5 py-0.5 text-sm font-bold transition ${set.id === a.id ? 'bg-[#0F6FD6] border-[#0F6FD6] text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'}`}>
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
              {t('editarActividad', set.topic ?? set.title, mine(set))}
            </button>
          </Field>
        </div>

        {teamMode && <TeamsPanel store={store} base={base} meta={meta} teams={teams} players={players} online={online} onKick={onKick} />}
      </section>
    </div>
  )
}

/* Armado de equipos en el lobby: al azar (el profesor reparte) o que elijan en
   el celular. Todo queda editable: nombres, cantidad y quién va dónde. */
function TeamsPanel({ store, base, meta, teams, players, online, onKick }) {
  const t = useT()
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
    store.update(base, Object.fromEntries(Object.entries(assigned).map(([id, tm]) => [`players/${id}/team`, tm])))
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
        title={t('moverEquipo')} className="bg-transparent text-sm cursor-pointer">
        <option value="">—</option>
        {ids.map((id) => <option key={id} value={id}>{teams[id].emoji}</option>)}
      </select>
      <button onClick={() => onKick(id)} title={t('expulsar')}
        className="w-5 h-5 rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-700">×</button>
    </li>
  )

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 flex-1 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-bold">{t('equiposAlumnos', everyone.length)}</p>
        <Segmented value={pick} onChange={(teamPick) => store.update(`${base}/meta`, { teamPick })}
          options={[['random', t('alAzar')], ['choose', t('ellosEligen')]]} />
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 gap-1">
          <button onClick={() => setCount(ids.length - 1)} disabled={ids.length <= 2}
            className="w-8 h-8 rounded-lg font-black hover:bg-white disabled:opacity-30">−</button>
          <span className="px-1 text-sm font-bold tabular-nums">{t('nEquipos', ids.length)}</span>
          <button onClick={() => setCount(ids.length + 1)} disabled={ids.length >= MAX_TEAMS}
            className="w-8 h-8 rounded-lg font-black hover:bg-white disabled:opacity-30">+</button>
        </div>
        <Button variant="ghost" className="!py-2 text-sm" onClick={shuffle} disabled={!everyone.length}>{t('repartirAzar')}</Button>
      </div>
      <p className="text-sm text-slate-500">
        {pick === 'choose' ? t('ayudaElegir') : t('ayudaAzar')}
        {t('ayudaEquipos', TEAM_MIN, TEAM_MAX)}
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {ids.map((id) => {
          const members = membersOf(id, players)
          const off = members.length < TEAM_MIN || members.length > TEAM_MAX
          const st = presetOf(id)
          return (
            <div key={id} className={`rounded-2xl border-2 p-3 ${st.border} ${st.tint}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{teams[id].emoji}</span>
                <input key={teams[id].name} defaultValue={teams[id].name} maxLength={20} aria-label={t('nombreEquipo')}
                  onBlur={(e) => rename(id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="flex-1 min-w-0 bg-transparent font-black outline-none border-b border-transparent focus:border-slate-400" />
                <span title={t('porEquipo', TEAM_MIN, TEAM_MAX)}
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
            <p className="font-black text-slate-500">{t('sinEquipo', unassigned.length)}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">{unassigned.map(member)}</ul>
          </div>
        )}
      </div>
    </div>
  )
}

/* Las actividades que el docente creó desde cero, en el curso y EA elegidos. */
function MyActivities({ user, entries, selected, onSelect, onCreate }) {
  const t = useT()
  const [choosing, setChoosing] = useState(false)
  return (
    <div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 p-3">
      <p className="font-bold">
        {t('misActividades')} <span className="font-normal text-slate-500">{t('creadasPorTi')}</span>
      </p>
      {entries.length > 0 && (
        <div className="mt-2 grid sm:grid-cols-2 gap-2">
          {entries.map(([id, info]) => (
            <button key={id} onClick={() => onSelect(id)}
              className={`rounded-lg border-2 px-3 py-2 text-left transition ${selected === id ? 'border-[#0F6FD6] bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <span className="block font-bold truncate">{info.title}</span>
              <span className="block text-xs text-slate-500">
                {info.mechanic === 'choice' ? t('opcionMultiple') : 'Answer Builder'} · {t('nPreguntas', info.count)}
              </span>
            </button>
          ))}
        </div>
      )}
      {!choosing ? (
        <button onClick={() => setChoosing(true)} className="mt-2 text-sm font-bold text-[#0F6FD6] hover:underline">
          {t('crearActividad', Boolean(user))}
        </button>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-slate-600">{t('deQueTipo')}</span>
          <Button variant="ghost" className="!py-1.5 text-sm" onClick={() => { setChoosing(false); onCreate('choice') }}>
            {t('opcionMultipleKahoot')}
          </Button>
          <Button variant="ghost" className="!py-1.5 text-sm" onClick={() => { setChoosing(false); onCreate('builder') }}>
            Answer Builder
          </Button>
          <button onClick={() => setChoosing(false)} className="text-slate-500 hover:underline">{t('cancelar')}</button>
        </div>
      )}
    </div>
  )
}

/* Arma el editor según qué se edita: la versión propia de una actividad base,
   o una actividad creada desde cero (nueva o existente). */
function ActivityEditor({ store, user, editing, library, customIndex, current, onSelect, onClose }) {
  const t = useT()
  const root = `libraries/${user.uid}`
  if (editing.kind === 'base') {
    const original = getSet(editing.id)
    const edited = library[editing.id]
    return (
      <Editor key={editing.id} heading={t('editandoVersion')}
        title={`${original.courseName} · ${original.ea} · ${original.title}`}
        subheading={t('cambiosSoloTuyos', user.name)}
        mechanic={isChoice(original.questions[0]) ? 'choice' : 'builder'}
        questions={applyLibrary(original, edited).questions}
        onSave={(questions) => store.set(`${libraryPath(user.uid)}/${editing.id}`, { questions, updatedAt: store.stamp() })}
        discardLabel={edited ? t('restaurarOriginal') : null}
        onDiscard={async () => {
          if (!confirm(t('confirmarRestaurar'))) return false
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
  if (!questions.length) return <Center>{t('cargandoActividad')}</Center>
  return (
    <Editor key={editing.id} heading={editing.isNew ? t('nuevaActividad') : t('editandoActividad')} titled title={info.title}
      subheading={`${course?.name} · EA${info.ea + 1} · ${info.mechanic === 'choice' ? t('opcionMultiple') : 'Answer Builder'} · ${t('soloTuLaVes')}`}
      mechanic={info.mechanic} questions={questions}
      onSave={async (qs, title) => {
        await store.update(root, {
          [`custom/${editing.id}`]: { ...info, title, count: qs.length, updatedAt: store.stamp() },
          [`customQuestions/${editing.id}`]: qs,
        })
        onSelect(editing.id)
      }}
      discardLabel={editing.isNew ? null : t('eliminarActividad')}
      onDiscard={async () => {
        if (!confirm(t('confirmarEliminar', info.title))) return false
        onSelect(course.eas[info.ea].activities[0].id)
        await store.update(root, { [`custom/${editing.id}`]: null, [`customQuestions/${editing.id}`]: null })
        return true
      }}
      onClose={onClose} />
  )
}

/* Pregunta con imagen en pantalla ancha: la imagen a la izquierda con TODO el
   alto de la ventana, y la pregunta con sus alternativas a la derecha. En una
   pantalla de notebook (ancha y baja) apilarlas dejaba la foto en ~300 px de
   alto con los costados vacíos. En pantallas angostas se apila igual. */
function PictureLayout({ src, children }) {
  return (
    <section className="flex-1 min-h-0 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,8fr)_minmax(0,5fr)] lg:gap-8">
      <div className="flex-1 min-h-[30vh] lg:min-h-0 flex items-center justify-center">
        <img src={src} alt="" className="max-h-full max-w-full rounded-2xl shadow-md object-contain bg-white" />
      </div>
      <div className="min-h-0 flex flex-col justify-center gap-4">{children}</div>
    </section>
  )
}

/* Ocupa todo el alto libre de la columna (flex-1) sin deformarse ni pasar de
   su tamaño real. `min` = lo que se le respeta si falta espacio. */
function QuestionImage({ src, min = 'min-h-[22vh]' }) {
  return (
    <div className={`flex-1 ${min} flex items-center justify-center`}>
      <img src={src} alt="" className="max-h-full max-w-full rounded-2xl shadow-md object-contain bg-white" />
    </div>
  )
}

/* En pleno juego el QR queda chico en una esquina, por si llega alguien tarde;
   al tocarlo se agranda para escanearlo desde lejos. Va arriba a la izquierda,
   justo bajo la cabecera, y angosto: abajo a la derecha tapaba alternativas
   cuando se proyectaba desde el PC del docente. Cuelga de la cabecera (absolute,
   no fixed) para quedar siempre bajo ella aunque se parta en dos líneas. */
function JoinCorner({ pin }) {
  const t = useT()
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
          <p className="text-slate-500 font-bold uppercase tracking-widest">{t('unirseJuego')}</p>
          <img src={qr} alt={t('qrUnirse')} className="w-[min(60vh,80vw)] h-[min(60vh,80vw)]" />
          <p className="text-6xl font-black tracking-[.2em]">{pin}</p>
          <p className="text-slate-500 text-sm">{joinUrl.replace(/^https?:\/\//, '')} · {t('tocaCerrar')}</p>
        </div>
      </div>
    )
  }
  return (
    <button onClick={() => setOpen(true)} title={t('agrandarCodigo')}
      className="absolute top-3 left-3 z-30 flex flex-col items-center gap-0.5 rounded-xl bg-white/95 border border-slate-200 shadow-md p-1.5 hover:shadow-lg transition">
      <img src={qr} alt="" className="w-16 h-16" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none mt-0.5">{t('unirseCorto')}</span>
      <span className="text-sm font-black tracking-wider tabular-nums leading-tight">{pin}</span>
    </button>
  )
}

function MineBadge() {
  const t = useT()
  return (
    <span className="inline-block mt-1 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5">
      {t('tuVersion')}
    </span>
  )
}

/* El inicio de sesión solo hace falta para editar. Los errores de configuración
   de Firebase se traducen a lo que el docente tiene que hacer. */
async function signInFriendly(store, idioma) {
  try {
    return await store.signIn()
  } catch (e) {
    const why = {
      'auth/popup-closed-by-user': null,
      'auth/cancelled-popup-request': null,
      'auth/popup-blocked': 'errPopupBloqueado',
      'auth/operation-not-allowed': 'errSinGoogle',
      'auth/unauthorized-domain': 'errDominio',
    }[e.code]
    if (why !== null) alert(why ? traducir(idioma, why) : traducir(idioma, 'errSesion', e.message))
    return null
  }
}

function Account({ store, user }) {
  const t = useT()
  if (user === undefined) return null
  if (!user) {
    return (
      <Button variant="ghost" className="!py-2 text-sm" onClick={() => signInFriendly(store, t.idioma)}>
        {t('iniciarSesion')}
      </Button>
    )
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      {user.photo && <img src={user.photo} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full" />}
      <span className="font-bold max-w-[10rem] truncate">{user.name}</span>
      <button onClick={() => store.signOut()} className="text-slate-500 hover:underline">{t('salir')}</button>
    </span>
  )
}

/* "Básico II · EA1 · Grammar Focus · Object pronouns", para títulos y archivos. */
function activityLabel(set) {
  const course = set.courseName ?? COURSES.find((c) => c.id === set.course)?.name
  return [course, set.ea, set.title].filter(Boolean).join(' · ')
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
function Leaderboard({ title, rows, board, footnote, double, onNext }) {
  const t = useT()
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
            {t('duelo', duel.gap)}
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
          <p className="text-sm font-black uppercase tracking-[.3em]">{t('dueloFinal')}</p>
          <p className="text-3xl font-black">{board.finalDuel.upper.name} <span className="opacity-80">vs</span> {board.finalDuel.lower.name}</p>
          <p className="font-bold">{t('solo', board.finalDuel.gap)}</p>
        </div>
      )}
      {overtakes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {overtakes.map((o) => (
            <span key={o.who.id} className="rounded-full bg-violet-600 text-white font-black px-4 py-1.5 text-lg shadow animate-rise">
              {t('adelanto', o.who.name, o.over.name)}
            </span>
          ))}
        </div>
      )}
      <ol className="flex flex-col gap-2">{items}</ol>
      {footnote && <p className="text-center text-slate-500">{footnote}</p>}
      {double?.on && <DoubleBanner text={t('dobleProxima')} />}
      <div className="flex flex-wrap justify-center gap-3">
        {double && (
          <Button variant="ghost" onClick={double.onToggle} aria-pressed={double.on}
            className={double.on ? '!bg-amber-400 !border-amber-400 !text-amber-950' : ''}>
            {double.on ? t('dobleQuitar') : t('dobleActivar')}
          </Button>
        )}
        <Button onClick={onNext}>{t('siguientePregunta')}</Button>
      </div>
    </section>
  )
}

/* Aviso del 2X en el proyector: antes de la última pregunta y mientras se juega. */
function DoubleBanner({ text }) {
  const t = useT()
  return (
    <span className="block mx-auto my-2 w-fit rounded-2xl bg-amber-400 text-amber-950 px-6 py-2 text-3xl font-black normal-case tracking-normal shadow-lg animate-rise">
      {text ?? t('dobleAviso')}
    </span>
  )
}

function BoardRow({ row, place }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl px-5 py-3 text-xl ${row.tint ?? 'bg-white border border-slate-200'}`}>
      <span className="w-8 font-black text-slate-400">{place}</span>
      <span className="flex-1 min-w-0 flex items-center gap-2">
        <StreakName name={row.name} streak={row.streak} className="font-bold truncate" />
        {row.extra}
      </span>
      {row.gain > 0 && <span className="text-green-600 font-bold">+{row.gain}</span>}
      <span className="w-24 text-right font-black tabular-nums">{row.total}</span>
    </div>
  )
}

function SoundControl({ className = '' }) {
  const t = useT()
  const sound = getSound()
  const [s, setS] = useState(sound.state)
  useEffect(() => sound.subscribe(setS), [sound])

  if (!s.running) {
    return (
      <button onClick={sound.unlock}
        className={`rounded-full bg-amber-100 text-amber-900 font-bold text-sm px-4 py-2 animate-pulse ${className}`}>
        {t('activarSonido')}
      </button>
    )
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button onClick={() => sound.setMuted(!s.muted)} title={s.muted ? t('activarSonidoCorto') : t('silenciar')}
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-xl">
        {s.muted ? '🔇' : '🔊'}
      </button>
      <input type="range" min="0" max="1" step="0.05" value={s.volume} aria-label={t('volumen')}
        disabled={s.muted} onChange={(e) => sound.setVolume(Number(e.target.value))}
        className="w-24 accent-[#0F6FD6] disabled:opacity-40" />
    </div>
  )
}

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <p className="text-sm font-bold text-slate-500 leading-tight">{label}</p>
      <div className="shrink-0">{children}</div>
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
          className={`rounded-lg px-2.5 py-1 text-sm font-bold transition ${value === v ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Reveal({ state, isLast, ranking, image, onNext }) {
  const t = useT()
  if (state.question.kind === 'choice') return <ChoiceReveal state={state} isLast={isLast} ranking={ranking} image={image} onNext={onNext} />
  const { solution, stats } = state
  const pct = (k) => (stats.answered ? Math.round((stats[k] / stats.answered) * 100) : 0)
  const fullPct = stats.answered ? Math.round(((stats.full || 0) / stats.answered) * 100) : 0
  const shown = {
    subject: solution.subject.join(' / '),
    verb: solution.verb.join(' / '),
    wh: t(`wh_${solution.wh}`),
  }
  return (
    <section className={`flex-1 min-h-0 flex flex-col ${image ? 'gap-4' : 'gap-8 justify-center'}`}>
      {image && <QuestionImage src={image} min="min-h-[16vh]" />}
      <Prompt text={state.question.prompt} className="text-center text-4xl md:text-5xl" />
      <div className="grid md:grid-cols-3 gap-4">
        {PART_KEYS.map((k) => (
          <div key={k} className={`rounded-3xl border-2 p-6 flex flex-col gap-3 ${ROLES[k].border} ${ROLES[k].tint}`}>
            <RoleTag part={k} className="self-start" />
            <p className={`text-3xl font-black ${ROLES[k].text}`}>{shown[k]}</p>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div className={`h-full ${ROLES[k].solid}`} style={{ width: `${pct(k)}%` }} />
            </div>
            <p className="text-sm font-bold text-slate-600">{t('pctCorrecto', pct(k))}</p>
          </div>
        ))}
      </div>
      {solution.example && (
        <p className="text-center text-2xl text-slate-600">
          {t('respuestaPosible')} <i className="text-slate-900">“{solution.example}”</i>
        </p>
      )}
      {/* El número que explica la reacción del público (aplausos desde 70 %,
          asombro bajo 40 %): cuántos armaron la respuesta COMPLETA, las tres
          partes bien. Sin él, los aplausos sonaban sin que se viera por qué. */}
      <p className="text-center text-2xl text-slate-600">
        <b className="text-slate-900 text-4xl font-black tabular-nums">{fullPct}%</b>{t('completoRespuestas', stats.answered)}
      </p>
      {state.practice && <PracticePoints ranking={ranking} />}
      <div className="flex justify-center">
        <Button onClick={onNext}>{t(nextLabel(state, isLast))}</Button>
      </div>
    </section>
  )
}

const nextLabel = (state, isLast) => (state.practice ? 'aJugar' : isLast ? 'verPodio' : 'verRanking')

/* Opción múltiple en el proyector: las alternativas con su color y figura, igual
   que en los celulares. Al revelar se marca la correcta y cuántos eligió cada una. */
/* Answer Builder en el proyector: las mismas opciones (y en el mismo orden) que
   ven los celulares, para que el profesor sepa entre qué están eligiendo. En el
   modo "Escribirlos", sujeto y verbo no tienen opciones: se escriben. */
function BuilderOptions({ question, mode }) {
  const t = useT()
  const columns = {
    subject: mode === 'write' ? null : question.subjectOptions,
    verb: mode === 'write' ? null : question.verbOptions,
    wh: question.whOptions?.map((k) => t(`wh_${k}`)),
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
            : <p className="text-lg font-bold text-slate-500">{t('alumnosEscriben')}</p>}
        </div>
      ))}
    </div>
  )
}

/* `compact`: con imagen, alternativas más bajas para dejarle alto a la foto.
   `stacked`: una debajo de otra (en la columna angosta junto a la imagen). */
function ChoiceTiles({ options, answer, votes, compact = false, stacked = false }) {
  const revealed = answer != null
  const total = votes ? votes.reduce((a, b) => a + b, 0) : 0
  return (
    <div className={`grid ${stacked ? 'grid-cols-1' : choiceCols(options)} gap-3 max-w-5xl w-full mx-auto`}>
      {options.map((o, i) => {
        const st = CHOICE_STYLES[i]
        const right = o === answer
        return (
          <div key={o}
            className={`relative overflow-hidden rounded-2xl px-5 ${compact ? 'py-2.5' : 'py-3.5'} flex items-center gap-4 text-white text-2xl lg:text-3xl font-bold transition ${st.solid} ${revealed && !right ? 'opacity-35' : ''} ${revealed && right ? 'ring-8 ring-green-300' : ''}`}>
            <ChoiceLetter style={st} className="w-11 h-11 text-2xl" />
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
  const t = useT()
  const { solution, stats } = state
  const pct = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0
  return (
    image ? (
      <PictureLayout src={image}>
        <Prompt text={state.question.prompt} highlightWh={false} className="text-center text-4xl xl:text-5xl" />
        <ChoiceTiles options={state.question.options} answer={solution.answer} votes={stats.votes} compact stacked />
        <p className="text-center text-xl text-slate-600">
          <b className="text-slate-900 text-3xl font-black tabular-nums">{pct}%</b>{t('correctoRespuestas', stats.answered)}
        </p>
        {state.practice && <PracticePoints ranking={ranking} />}
        <div className="flex justify-center">
          <Button onClick={onNext}>{t(nextLabel(state, isLast))}</Button>
        </div>
      </PictureLayout>
    ) : (
      <section className="flex-1 min-h-0 flex flex-col gap-8 justify-center">
        <Prompt text={state.question.prompt} highlightWh={false} className="text-center text-4xl md:text-5xl" />
        <ChoiceTiles options={state.question.options} answer={solution.answer} votes={stats.votes} />
        <p className="text-center text-2xl text-slate-600">
          <b className="text-slate-900 text-4xl font-black tabular-nums">{pct}%</b>{t('correctoRespuestas', stats.answered)}
        </p>
        {state.practice && <PracticePoints ranking={ranking} />}
        <div className="flex justify-center">
          <Button onClick={onNext}>{t(nextLabel(state, isLast))}</Button>
        </div>
      </section>
    )
  )
}

/* Lo que cada uno habría ganado en el simulacro: enseña cómo se puntúa
   (partes correctas × rapidez) sin que cuente para el juego. */
function PracticePoints({ ranking }) {
  const t = useT()
  const list = [...ranking].sort((a, b) => b.gain - a.gain)
  return (
    <div className="max-w-2xl w-full mx-auto rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50 p-5">
      <p className="text-center font-bold text-violet-800 mb-3">
        {t('puntosPractica')}
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

/* Oro, plata y bronce se ven igual en los dos temas. Por eso el texto va en hex
   (amber-900, slate-700, orange-900) y no con la clase: el modo oscuro aclara
   esas clases, y sobre el metal quedarían ilegibles. */
const PLACES = {
  1: { medal: '🥇', pedestal: 'h-[clamp(6rem,20vh,14rem)] bg-gradient-to-b from-yellow-300 to-amber-500 text-[#78350f]', width: 'w-60' },
  2: { medal: '🥈', pedestal: 'h-[clamp(4.5rem,14vh,10rem)] bg-gradient-to-b from-slate-200 to-slate-400 text-[#334155]', width: 'w-44' },
  3: { medal: '🥉', pedestal: 'h-[clamp(3rem,9vh,7rem)] bg-gradient-to-b from-orange-300 to-orange-500 text-[#7c2d12]', width: 'w-44' },
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

const PODIUM_LIST = 15 // el podio lista hasta el 15.º; los demás, en el resumen del curso

function Podium({ ranking, mvp, stage, onAgain, onReport }) {
  const t = useT()
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
            {champion && <span className="text-4xl -mb-2">👑</span>}
            <span className={champion ? 'text-6xl' : 'text-4xl'}>{style.medal}</span>
            <span className={`font-black text-center truncate w-full ${champion ? 'text-3xl' : 'text-2xl'}`}>{p.name}</span>
            {/* Los puntos llegan al final, todos a la vez, para comparar las
                distancias sin adelantar quién ganó. El espacio queda reservado. */}
            <span className={`font-bold tabular-nums text-slate-600 ${champion ? 'text-2xl' : 'text-lg'}
              ${stage.rest ? 'animate-rise' : 'invisible'}`}>
              {stage.rest ? <CountUp to={p.total} /> : 0} {t('ptsCorto')}
            </span>
          </div>
        )}
        <div className={`w-full rounded-t-3xl grid place-items-center font-black shadow-lg ${style.pedestal}
          ${champion && shown[1] ? 'animate-glow' : ''}`}>
          <span className={`text-5xl ${waiting ? 'animate-pulse opacity-60' : ''}`}>
            {waiting ? '?' : place}
          </span>
        </div>
      </div>
    )
  }

  return (
    <section className="flex flex-col items-center gap-5">
      <h2 className="text-3xl font-black">
        {stage.first ? t('yElGanadorFiesta') : stage.drumroll ? t('yElGanador') : t('resultadosFinales')}
      </h2>
      <div className="flex items-end gap-3 min-h-[clamp(14rem,40vh,26rem)]">
        {column(2)}
        {column(1)}
        {column(3)}
      </div>
      {stage.rest && ranking.length > 3 && (
        /* Del 4.º al 15.º en columnas; el resto, en el resumen del curso: con 30
           alumnos la lista completa empujaba el podio fuera de la pantalla. */
        <ol start={4} className="w-full max-w-5xl grid sm:grid-cols-2 lg:grid-cols-4 gap-1.5 animate-rise">
          {ranking.slice(3, PODIUM_LIST).map((p, i) => (
            <li key={p.id} className="flex gap-3 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-sm">
              <span className="w-6 text-slate-400 font-bold">{i + 4}</span>
              <span className="flex-1 font-bold truncate">{p.name}</span>
              <span className="tabular-nums font-bold">{p.total}</span>
            </li>
          ))}
          {ranking.length > PODIUM_LIST && (
            <li className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-500">
              {t('yNMas', ranking.length - PODIUM_LIST)}
            </li>
          )}
        </ol>
      )}
      {stage.rest && mvp && (
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-amber-100 to-yellow-50 border-2 border-amber-300 px-5 py-2 animate-rise">
          <span className="text-4xl">⭐</span>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-amber-700">{t('mvpMejor')}</p>
            <p className="text-2xl font-black">{mvp.name} <span className="text-lg font-bold text-slate-600 tabular-nums">· {mvp.total} {t('ptsCorto')}</span></p>
          </div>
        </div>
      )}
      {stage.rest && (
        <div className="flex flex-wrap justify-center gap-3 animate-rise">
          <Button onClick={onReport}>{t('resumenCurso')}</Button>
          <Button variant="ghost" onClick={onAgain}>{t('jugarOtraVez')}</Button>
        </div>
      )}
    </section>
  )
}
