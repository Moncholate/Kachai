/* Corta un tema de Suno en un loop sin costura para la música de fondo.

   Uso: node tools/make-loop.mjs "audio source/Tema.wav" public/audio/salida.ogg [--min 35] [--max 65] [--lufs -15.1]

   1. Tempo y fase del pulso (los temas se piden a ~116 BPM con un tic en cada pulso).
   2. Busca inicio y fin del loop en bordes de compás, entre --min y --max segundos,
      donde lo que suena justo antes y justo después del fin se parece más a lo que
      suena justo antes y justo después del inicio (bandas de frecuencia, compás a compás).
      No usa los últimos segundos: ahí Suno suele cerrar o desvanecer.
   3. Afina el fin a nivel de muestra (correlación de la onda) y une con un fundido
      de 20 ms con lo que sonaba antes del inicio: inaudible y sin "clic".
   4. Iguala el volumen al de la música actual (--lufs, integrado EBU R128) y guarda OGG.
   Además deja <salida>.seam.wav: 4 s antes y después de la unión, para escucharla. */
import { execFileSync, spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? Number(args[i + 1]) : fallback
}
const [input, output] = args
const MIN = opt('min', 35)
const MAX = opt('max', 65)
const LUFS = opt('lufs', -15.1)
const TAIL_GUARD = 4 // s finales que no se usan

const decode = (sr, ch) => {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', input, '-ac', String(ch), '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 2 ** 31 })
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength))
}

/* ── análisis en mono a 22 050 Hz ── */
const SR = 22050
const mono = decode(SR, 1)
const dur = mono.length / SR

// envolvente cada 10 ms y ataques, para el tempo
const HOP = 220
const nEnv = Math.floor(mono.length / HOP)
const env = new Float32Array(nEnv)
for (let i = 0; i < nEnv; i++) {
  let s = 0
  for (let j = 0; j < HOP; j++) s += mono[i * HOP + j] ** 2
  env[i] = Math.sqrt(s / HOP)
}
const onset = env.map((v, i) => (i ? Math.max(0, v - env[i - 1]) : 0))
let bpm = 0
let bestT = -1
for (let b = 100; b <= 135; b += 0.01) {
  const lag = 6000 / b
  let s = 0
  for (let i = 0; i + lag * 8 < nEnv; i++) s += onset[i] * onset[Math.round(i + lag)] + onset[i] * onset[Math.round(i + lag * 4)]
  if (s > bestT) { bestT = s; bpm = b }
}
const beat = 60 / bpm
const bar = beat * 4
let phase = 0
let bestP = -1
for (let t = 0; t < beat; t += 0.002) {
  let s = 0
  for (let k = 0; t + k * beat < dur; k++) s += onset[Math.round((t + k * beat) * 100)] || 0
  if (s > bestP) { bestP = s; phase = t }
}

// bandas de frecuencia (STFT 2048 / salto 256 ≈ 11.6 ms), 24 bandas logarítmicas
const N = 2048
const FH = 256
const frames = Math.floor((mono.length - N) / FH)
const BANDS = 24
const edges = Array.from({ length: BANDS + 1 }, (_, i) => Math.round((60 * (9000 / 60) ** (i / BANDS)) / (SR / N)))
const hann = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N))
function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]] }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const c = Math.cos(a * k), s = Math.sin(a * k)
        const ur = re[i + k], ui = im[i + k]
        const vr = re[i + k + len / 2] * c - im[i + k + len / 2] * s
        const vi = re[i + k + len / 2] * s + im[i + k + len / 2] * c
        re[i + k] = ur + vr; im[i + k] = ui + vi
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi
      }
    }
  }
}
const feat = new Float32Array(frames * BANDS)
{
  const re = new Float32Array(N), im = new Float32Array(N)
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = mono[f * FH + i] * hann[i]; im[i] = 0 }
    fft(re, im)
    for (let b = 0; b < BANDS; b++) {
      let s = 0
      for (let k = edges[b]; k < Math.max(edges[b + 1], edges[b] + 1); k++) s += re[k] ** 2 + im[k] ** 2
      feat[f * BANDS + b] = Math.log10(1e-9 + s)
    }
  }
}
const frameAt = (t) => Math.round((t * SR) / FH)

/* Parecido entre dos tramos de igual largo: correlación de Pearson de sus bandas. */
function similarity(t1, t2, len) {
  const f1 = frameAt(t1), f2 = frameAt(t2), n = frameAt(len)
  if (f1 < 0 || f2 < 0 || f1 + n >= frames || f2 + n >= frames) return -1
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, c = 0
  for (let i = 0; i < n * BANDS; i++) {
    const a = feat[f1 * BANDS + i], b = feat[f2 * BANDS + i]
    sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; c++
  }
  const cov = sab - (sa * sb) / c
  return cov / Math.sqrt((saa - (sa * sa) / c) * (sbb - (sb * sb) / c) || 1e-9)
}

/* ── búsqueda de inicio y fin ── */
const usable = dur - TAIL_GUARD
let best = null
/* Suno no lleva un tempo exacto: contar compases deja el corte corrido hasta
   ~150 ms, un tropezón audible. Por eso cada fin candidato se alinea con el
   ritmo real: dentro de ±450 ms, donde los ataques que siguen al fin coinciden
   con los que siguen al inicio (ataques cada 5 ms, ventana de 6 s). */
const on5 = (() => {
  const H = 110
  const e = []
  for (let i = 0; i * H < mono.length; i++) {
    let q = 0
    for (let j = 0; j < H; j++) q += (mono[i * H + j] || 0) ** 2
    e.push(Math.sqrt(q / H))
  }
  return e.map((v, i) => (i ? Math.max(0, v - e[i - 1]) : 0))
})()
function alignRhythm(s, e) {
  const S = Math.round(s * 200), E = Math.round(e * 200), W = 1200
  let bestLag = 0, bestC = -1
  for (let lag = -90; lag <= 90; lag++) {
    let c = 0
    for (let i = 0; i < W; i++) c += (on5[S + i] || 0) * (on5[E + lag + i] || 0)
    if (c > bestC) { bestC = c; bestLag = lag }
  }
  return e + bestLag / 200
}

for (let i = 1; phase + i * bar + MIN <= usable; i++) {
  const s = phase + i * bar
  for (let m = Math.ceil(MIN / bar); s + m * bar + bar <= usable && m * bar <= MAX; m++) {
    const e = alignRhythm(s, s + m * bar)
    if (e + 2 * bar > usable) continue
    // lo que sigue al corte debe parecerse al inicio del loop, y lo previo al corte, a lo previo al inicio
    const score = similarity(s, e, bar) + similarity(s - bar, e - bar, bar) + 0.5 * similarity(s, e, 2 * bar)
    if (!best || score > best.score) best = { s, e, m, score }
  }
}
if (!best) throw new Error('No hay tramo suficientemente largo para un loop')

// fin a nivel de muestra: la onda que sigue al fin debe calzar con la que sigue al inicio
const SR_OUT = 48000
const stereo = decode(SR_OUT, 2)
const frames48 = stereo.length / 2
const s48 = Math.round(best.s * SR_OUT)
let e48 = Math.round(best.e * SR_OUT)
{
  const W = Math.round(0.3 * SR_OUT), R = Math.round(0.012 * SR_OUT)
  let bestC = -Infinity, bestD = 0
  for (let d = -R; d <= R; d++) {
    let c = 0
    for (let i = 0; i < W; i += 2) c += stereo[(s48 + i) * 2] * stereo[(e48 + d + i) * 2] + stereo[(s48 + i) * 2 + 1] * stereo[(e48 + d + i) * 2 + 1]
    if (c > bestC) { bestC = c; bestD = d }
  }
  e48 += bestD
}

// loop = [s, e); los últimos 20 ms se funden con lo que sonaba justo antes de s
const L = e48 - s48
const C = Math.round(0.02 * SR_OUT)
const out = new Float32Array(L * 2)
for (let i = 0; i < L; i++) {
  for (let ch = 0; ch < 2; ch++) {
    let v = stereo[(s48 + i) * 2 + ch]
    const k = i - (L - C)
    if (k >= 0) {
      const w = k / C
      v = v * Math.cos((w * Math.PI) / 2) + stereo[(s48 - C + k) * 2 + ch] * Math.sin((w * Math.PI) / 2)
    }
    out[i * 2 + ch] = v
  }
}

// volumen igual al de la música actual (ebur128 informa en stderr)
const pcm = Buffer.from(out.buffer)
const meter = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-f', 'f32le', '-ar', String(SR_OUT), '-ac', '2', '-i', '-',
  '-af', 'ebur128', '-f', 'null', '-'], { input: pcm, maxBuffer: 2 ** 30 })
// cada cuadro informa su "I:" acumulado; el último es el integrado de todo el tema
const lufs = Number([...meter.stderr.toString().matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)[1])
const gain = LUFS - lufs

execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR_OUT), '-ac', '2', '-i', '-',
  '-af', `volume=${gain.toFixed(2)}dB`, '-c:a', 'libvorbis', '-q:a', '5', output], { input: pcm })

// costura para escuchar: 4 s antes del fin + 4 s desde el inicio del loop (ya con el fundido)
const SEAM = 4 * SR_OUT
const seam = new Float32Array(SEAM * 4)
seam.set(out.subarray((L - SEAM) * 2, L * 2), 0)
seam.set(out.subarray(0, SEAM * 2), SEAM * 2)
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR_OUT), '-ac', '2', '-i', '-',
  '-af', `volume=${gain.toFixed(2)}dB`, `${output}.seam.wav`], { input: Buffer.from(seam.buffer) })

console.log(JSON.stringify({
  input, output, bpm: +bpm.toFixed(2), start: +(s48 / SR_OUT).toFixed(3), end: +(e48 / SR_OUT).toFixed(3),
  seconds: +(L / SR_OUT).toFixed(3), bars: best.m, match: +best.score.toFixed(3), lufsBefore: lufs, gainDb: +gain.toFixed(2),
}))

