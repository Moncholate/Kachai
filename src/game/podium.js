/* Guion de la revelación final, en ms desde que empieza la fase 'end'. El
   proyector y los celulares lo calculan con el mismo reloj (el del servidor),
   así que nadie ve su puesto antes de que aparezca en la pantalla. */
export const PODIUM_AT = {
  third: 1800,
  second: 4800,
  drumroll: 7000, // "And the winner is…" mientras suena el redoble del 1.º
  first: 8700,
  rest: 11000, // del 4.º lugar hacia abajo, y el botón "Jugar otra vez"
}

export function podiumStage(startedAt, now) {
  const t = typeof startedAt === 'number' ? now - startedAt : -1
  return Object.fromEntries(Object.entries(PODIUM_AT).map(([k, at]) => [k, t >= at]))
}

/* Sonidos del podio, pedidos por la profesora: un redoble antes de cada puesto
   que termina justo cuando aparece; mini fanfarria para el 3.º y el 2.º (un tono
   más aguda); para el 1.º, la fanfarria larga (el tema 'podium') sola.
   Duraciones en ms. La mini fanfarria dura ~800 ms: nada se pisa. */
export const FANFARE_MS = 800
const ROLL = 1600
const LAST_ROLL = 2400
export const PODIUM_SOUNDS = [
  { at: PODIUM_AT.third - ROLL, drumroll: ROLL },
  { at: PODIUM_AT.third, fanfare: 1 },
  { at: PODIUM_AT.second - ROLL, drumroll: ROLL },
  { at: PODIUM_AT.second, fanfare: 2 },
  { at: PODIUM_AT.first - LAST_ROLL, drumroll: LAST_ROLL },
  { at: PODIUM_AT.first, music: 'podium' },
]
