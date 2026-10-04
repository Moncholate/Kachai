/* Música y efectos, solo en la pantalla del profesor (el proyector). Los
   celulares no suenan: 30 celulares con música a la vez en la sala es ruido.

   Web Audio y no <audio loop>: un AudioBufferSource con loop repite sin hueco,
   y los temas están cortados para empalmar justo en el compás (ver audio source/).
   Los efectos se sintetizan aquí mismo: no hay archivos que cargar. */

const TRACKS = {
  lobby: { file: 'lobby.ogg', loop: true },
  answering: { file: 'answering.ogg', loop: true }, // Tick Tack Minigame
  answering2: { file: 'answering-2.ogg', loop: true }, // Clockwork Groove
  answering3: { file: 'answering-3.ogg', loop: true }, // Village Quest
  answering4: { file: 'answering-4.ogg', loop: true }, // Ticking Pulse
  podium: { file: 'podium.ogg', loop: false },
}

/* Temas para responder, en rotación: cada pregunta cambia de tema y nunca
   repite el de la anterior. Todos a 116 BPM y al mismo volumen (−15 LUFS),
   cortados en loop con tools/make-loop.mjs. */
export const ANSWERING_TRACKS = ['answering', 'answering2', 'answering3', 'answering4']
export const answeringTrack = (round, qIndex) =>
  ANSWERING_TRACKS[(((round || 0) + qIndex + 1) % ANSWERING_TRACKS.length + ANSWERING_TRACKS.length) % ANSWERING_TRACKS.length]
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

  /* ── Podio: redoble y mini fanfarria, sintetizados (chiptune, como el resto)
     para que duren EXACTAMENTE lo que el guion pide y nunca queden cortados. */
  let noise = null
  const noiseBuffer = () => {
    if (noise) return noise
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    return noise
  }
  function snare(at, level) {
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer()
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2200
    band.Q.value = 0.8
    const env = ctx.createGain()
    env.gain.setValueAtTime(level, at)
    env.gain.exponentialRampToValueAtTime(0.001, at + 0.07)
    src.connect(band).connect(env).connect(master)
    src.start(at, Math.random() * 0.5, 0.09)
  }
  /* Redoble que acelera y crece, y termina justo a los `seconds`: ahí aparece el puesto. */
  function drumroll(seconds) {
    if (ctx.state !== 'running') return
    const t0 = ctx.currentTime
    for (let t = 0; t < seconds - 0.03;) {
      const p = t / seconds
      snare(t0 + t, 0.12 + 0.5 * p * p)
      t += 0.075 - 0.04 * p // de 75 ms entre golpes a 35 ms
    }
  }
  /* "Ta-ta-ta-táaa" de 16 bits, ~0,8 s. step sube el tono: 1 = 3.º, 2 = 2.º. */
  function fanfare(step = 1) {
    if (ctx.state !== 'running') return
    const t0 = ctx.currentTime
    const root = 523.25 * 2 ** ((step - 1) * 2 / 12) // Do5, y un tono más arriba para el 2.º
    const notes = [1, 5 / 4, 3 / 2] // arpegio mayor
    notes.forEach((r, i) => blip(root * r, t0 + i * 0.09, { dur: 0.12, type: 'square', level: 0.22 }))
    const hold = t0 + notes.length * 0.09
    for (const [type, mult, level] of [['square', 2, 0.2], ['triangle', 1, 0.3], ['triangle', 0.5, 0.35]]) {
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(root * mult, hold)
      const vib = ctx.createOscillator() // un poco de vibrato en la nota larga
      const depth = ctx.createGain()
      vib.frequency.value = 6
      depth.gain.value = root * mult * 0.008
      vib.connect(depth).connect(osc.frequency)
      env.gain.setValueAtTime(level, hold)
      env.gain.setValueAtTime(level, hold + 0.3)
      env.gain.exponentialRampToValueAtTime(0.001, hold + 0.55)
      osc.connect(env).connect(master)
      osc.start(hold)
      vib.start(hold)
      osc.stop(hold + 0.6)
      vib.stop(hold + 0.6)
    }
  }

  return {
    play,
    effect,
    unlock,
    drumroll,
    fanfare,
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
