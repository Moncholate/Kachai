/* Analiza un tema para cortarlo en loop: tempo, primer tic, energía por compás.
   Uso: node tools/analyze-loop.mjs "audio source/Tema.wav" [bpm] */
import { execFileSync } from 'node:child_process'

const file = process.argv[2]
const SR = 22050
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 })
const x = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
const HOP = 220 // 10 ms
const n = Math.floor(x.length / HOP)
const env = new Float32Array(n)
for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < HOP; j++) { const v = x[i * HOP + j]; s += v * v } env[i] = Math.sqrt(s / HOP) }
const onset = new Float32Array(n)
for (let i = 1; i < n; i++) onset[i] = Math.max(0, env[i] - env[i - 1])

// tempo por autocorrelación (90–140 BPM)
let best = { bpm: 0, score: -1 }
for (let bpm = 90; bpm <= 140; bpm += 0.05) {
  const lag = 6000 / bpm // en hops de 10 ms
  let s = 0
  for (let i = 0; i + lag * 4 < n; i += 1) {
    const j = Math.round(i + lag)
    s += onset[i] * onset[j]
  }
  if (s > best.score) best = { bpm, score: s }
}
const bpm = Number(process.argv[3]) || best.bpm
const beat = 60 / bpm
// fase: desplazamiento que más energía de ataque junta sobre la grilla (primeros 30 s)
let phase = { t: 0, s: -1 }
for (let t = 0; t < beat; t += 0.005) {
  let s = 0
  for (let k = 0; t + k * beat < 30; k++) s += onset[Math.round((t + k * beat) * 100)] || 0
  if (s > phase.s) phase = { t, s }
}
const first = env.findIndex((v) => v > 0.01) / 100
const dur = x.length / SR
console.log(JSON.stringify({ file, dur: +dur.toFixed(3), bpmDetected: +best.bpm.toFixed(2), bpm, phase: +phase.t.toFixed(3), firstSound: first }))
// energía media por compás (4 pulsos) desde la fase
const bar = beat * 4
const rows = []
for (let t = phase.t, k = 0; t + bar <= dur + 0.001; t += bar, k++) {
  let s = 0, c = 0
  for (let i = Math.round(t * 100); i < Math.round((t + bar) * 100); i++) { s += env[i] || 0; c++ }
  rows.push(`${String(k).padStart(3)} ${t.toFixed(2).padStart(7)}s ${'#'.repeat(Math.round((s / c) * 300))}`)
}
console.log(rows.join('\n'))
