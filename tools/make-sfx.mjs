/* Prepara los efectos de sonido (ElevenLabs / Suno) para la app:
   recorta al largo útil, funde la cola, iguala el volumen y limita los picos.

   Uso: node tools/make-sfx.mjs            (todos)
        node tools/make-sfx.mjs duel       (solo uno)

   Los largos (ms) salen de mirar la envolvente de cada archivo: dónde termina el
   último golpe del redoble, dónde se apaga la fanfarria. El guion del podio
   (src/game/podium.js) usa ESTOS mismos largos para que nada se pise ni se corte. */
import { execFileSync, spawnSync } from 'node:child_process'

const SRC = 'audio source'
const OUT = 'public/audio'

// archivo → [origen, largo en ms, fundido final en ms, volumen objetivo (LUFS)]
export const SFX = {
  'drumroll-short': ['Drum roll short.wav', 1250, 70, -15],
  'drumroll-long': ['Drum roll long.wav', 2100, 80, -15],
  'fanfare-third': ['Third place Fanfare.wav', 3000, 250, -14],
  'fanfare-second': ['Second place Fanfare.wav', 4100, 350, -14],
  duel: ['Duel.wav', 550, 60, -15],
  overtake: ['Overtook.wav', 500, 60, -17],
  'crowd-yes': ['Positive crowd reaction.wav', 1950, 300, -18],
  'crowd-no': ['Negative crowd reaction.wav', 1850, 300, -18],
  applause: ['Champion round of applause.wav', 4000, 700, -19],
  join: ['User connected.wav', 900, 150, -21],
  'times-up': ["Time's up.wav", 750, 60, -15],
  streak: ['Streak.wav', 900, 120, -16],
}

const only = process.argv[2]
for (const [name, [file, ms, fade, lufs]] of Object.entries(SFX)) {
  if (only && only !== name) continue
  const cut = ['-af', `atrim=0:${ms / 1000},afade=t=out:st=${(ms - fade) / 1000}:d=${fade / 1000}`]
  // volumen del tramo recortado (el último "I:" de ebur128 es el integrado)
  const meter = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', `${SRC}/${file}`, ...cut.slice(0, 1), `${cut[1]},ebur128`, '-f', 'null', '-'])
  const measured = Number([...meter.stderr.toString().matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)[1])
  const gain = lufs - measured
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${SRC}/${file}`,
    '-af', `${cut[1]},volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:level=false`,
    '-ar', '48000', '-c:a', 'libvorbis', '-q:a', '5', `${OUT}/${name}.ogg`])
  console.log(`${name.padEnd(15)} ${String(ms).padStart(5)} ms  ${measured.toFixed(1)} → ${lufs} LUFS (${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB)`)
}
