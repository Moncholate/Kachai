/* Música y efectos, solo en la pantalla del profesor (el proyector). Los
   celulares no suenan: 30 celulares con música a la vez en la sala es ruido.

   Web Audio y no <audio loop>: un AudioBufferSource con loop repite sin hueco,
   y los temas están cortados para empalmar justo en el compás (ver audio source/).
   Los efectos se sintetizan aquí mismo: no hay archivos que cargar. */

const TRACKS = {
  lobby: { file: 'lobby.ogg', loop: true },
  answering: { file: 'answering.ogg', loop: true },
  podium: { file: 'podium.ogg', loop: false },
}
/* Efectos de Suno, cortos y de una sola vez: van directo al master, sin fundidos. */
const EFFECTS = {
  question: 'question.ogg', // aparece la pregunta (empieza la lectura)
  reveal: 'reveal.ogg', // se acaba el tiempo: redoble y respuesta
  ranking: 'ranking.ogg', // aparece el ranking
}
const MUSIC_LEVEL = 0.8 // deja aire a los efectos por encima de la música
const DUCKED_LEVEL = 0.25 // últimos segundos: la música se aparta para que se oigan los tics
const FADE_IN = 0.4
const FADE_OUT = 0.6

const prefs = {
  get(key, fallback) {
    try { const v = localStorage.getItem(`kachai-${key}`); return v == null ? fallback : JSON.parse(v) } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(`kachai-${key}`, JSON.stringify(value)) } catch { /* sin storage */ }
  },
}

function createSoundEngine() {
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.connect(ctx.destination)
  const music = ctx.createGain()
  music.gain.value = MUSIC_LEVEL
  music.connect(master)

  let volume = prefs.get('volume', 0.7)
  let muted = prefs.get('muted', false)
  const listeners = new Set()
  const state = () => ({ running: ctx.state === 'running', volume, muted })
  const emit = () => listeners.forEach((cb) => cb(state()))
  const applyVolume = () => master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05)
  applyVolume()
  ctx.onstatechange = emit

  /* El navegador no deja sonar nada hasta el primer clic en la página. Cualquier
     clic sirve (Comenzar, elegir set…), no solo el botón de activar sonido. */
  const unlock = () => ctx.resume()
  addEventListener('pointerdown', unlock)
  addEventListener('keydown', unlock)

  const loading = {}
  const load = (name) => {
    const file = TRACKS[name]?.file ?? EFFECTS[name]
    loading[name] ??= fetch(`${import.meta.env.BASE_URL}audio/${file}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.arrayBuffer() })
      .then((data) => ctx.decodeAudioData(data))
    return loading[name]
  }
  ;[...Object.keys(TRACKS), ...Object.keys(EFFECTS)]
    .forEach((name) => load(name).catch((e) => console.warn(`Kachai: no se pudo cargar ${name}`, e)))

  let current = null // { name, src, gain }
  let wanted = null

  function fadeOut(track) {
    const t = ctx.currentTime
    track.gain.gain.cancelScheduledValues(t)
    track.gain.gain.setValueAtTime(track.gain.gain.value, t)
    track.gain.gain.linearRampToValueAtTime(0, t + FADE_OUT)
    track.src.stop(t + FADE_OUT + 0.05)
  }

  /* Pedir el tema que ya suena no lo reinicia: lectura → respuesta sigue sin corte. */
  async function play(name) {
    wanted = name
    if (current?.name === name) return
    if (current) { fadeOut(current); current = null }
    if (!name) return
    let buffer
    try { buffer = await load(name) } catch { return }
    if (wanted !== name || current?.name === name) return // se pidió otra cosa mientras cargaba
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = TRACKS[name].loop
    const gain = ctx.createGain()
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(1, t + FADE_IN)
    src.connect(gain).connect(music)
    src.start()
    const track = { name, src, gain }
    src.onended = () => { if (current === track) current = null }
    current = track
  }

  function blip(freq, at, { dur = 0.05, type = 'square', level = 0.2 } = {}) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    env.gain.setValueAtTime(level, at)
    env.gain.exponentialRampToValueAtTime(0.001, at + dur)
    osc.connect(env).connect(master)
    osc.start(at)
    osc.stop(at + dur + 0.02)
  }

  /* Devuelve stop(): el redoble del podio se corta al aparecer el campeón,
     para que su golpe final no se pise con la fanfarria. */
  async function effect(name) {
    if (ctx.state !== 'running') return () => {}
    let buffer
    try { buffer = await load(name) } catch { return () => {} }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer = buffer
    src.connect(gain).connect(master)
    src.start()
    return () => {
      const t = ctx.currentTime
      gain.gain.setValueAtTime(gain.gain.value, t)
      gain.gain.linearRampToValueAtTime(0, t + 0.12)
      src.stop(t + 0.15)
    }
  }

  return {
    play,
    effect,
    unlock,
    /* Últimos segundos: un tic por segundo, y doble (más agudo) en los últimos 3.
       Dos osciladores a una octava: el agudo corta a través de la música. */
    tick(secondsLeft) {
      if (ctx.state !== 'running') return
      const freq = secondsLeft <= 3 ? 1320 : 990
      const hit = (at) => {
        blip(freq, at, { dur: 0.09, type: 'square', level: 0.45 })
        blip(freq * 2, at, { dur: 0.06, type: 'triangle', level: 0.3 })
      }
      hit(ctx.currentTime)
      if (secondsLeft <= 3) hit(ctx.currentTime + 0.5)
    },
    /* Baja la música (sin detenerla) mientras dura la cuenta regresiva. */
    duck(on) {
      music.gain.setTargetAtTime(on ? DUCKED_LEVEL : MUSIC_LEVEL, ctx.currentTime, 0.15)
    },
    /* Aparece un puesto del podio (3.º y 2.º): golpe grave y campanada. */
    place() {
      if (ctx.state !== 'running') return
      const t = ctx.currentTime
      blip(130, t, { dur: 0.35, type: 'triangle', level: 0.6 })
      blip(784, t, { dur: 0.25, type: 'square', level: 0.2 })
      blip(1175, t + 0.08, { dur: 0.35, type: 'square', level: 0.18 })
    },
    /* Alguien entró a la sala. */
    join() {
      if (ctx.state !== 'running') return
      const t = ctx.currentTime
      blip(660, t, { dur: 0.08, type: 'triangle', level: 0.3 })
      blip(990, t + 0.07, { dur: 0.12, type: 'triangle', level: 0.3 })
    },
    setVolume(v) { volume = v; prefs.set('volume', v); applyVolume(); emit() },
    setMuted(m) { muted = m; prefs.set('muted', m); applyVolume(); emit() },
    state,
    subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb) },
  }
}

let engine
export const getSound = () => (engine ??= createSoundEngine())
