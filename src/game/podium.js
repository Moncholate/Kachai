/* Guion de la revelación final, en ms desde que empieza la fase 'end'. El
   proyector y los celulares lo calculan con el mismo reloj (el del servidor),
   así que nadie ve su puesto antes de que aparezca en la pantalla.

   Los tiempos salen de los LARGOS REALES de los sonidos (ver tools/make-sfx.mjs):
   cada redoble termina justo cuando aparece su puesto, y cada fanfarria suena
   completa antes de que empiece el redoble siguiente. Si se cambia un sonido,
   se actualiza su largo aquí y el guion se acomoda solo. */
export const SOUND_MS = {
  drumrollShort: 1250,
  drumrollLong: 2100,
  fanfareThird: 3000,
  fanfareSecond: 4100,
}
const LEAD = 300 // un respiro antes del primer redoble
const GAP = 150 // entre el final de una fanfarria y el redoble siguiente

const third = LEAD + SOUND_MS.drumrollShort
const second = third + SOUND_MS.fanfareThird + GAP + SOUND_MS.drumrollShort
const first = second + SOUND_MS.fanfareSecond + GAP + SOUND_MS.drumrollLong

export const PODIUM_AT = {
  third,
  second,
  drumroll: first - SOUND_MS.drumrollLong, // "And the winner is…" mientras suena el redoble largo
  first,
  /* Del 4.º al 10.º, y los botones del final. Cinco segundos y no dos: el
     campeón tiene su momento solo en el escenario antes de que el podio se
     achique para dejar sitio a la lista (pedido de la profesora, 9-oct-2026). */
  rest: first + 5000,
}

export function podiumStage(startedAt, now) {
  const t = typeof startedAt === 'number' ? now - startedAt : -1
  return Object.fromEntries(Object.entries(PODIUM_AT).map(([k, at]) => [k, t >= at]))
}

/* Sonidos del podio, pedidos por la profesora: redoble antes de cada puesto,
   fanfarria propia para el 3.º y el 2.º, y para el 1.º la fanfarria larga
   (el tema 'podium') con aplausos más suaves encima. */
export const PODIUM_SOUNDS = [
  { at: third - SOUND_MS.drumrollShort, effect: 'drumrollShort' },
  { at: third, effect: 'fanfareThird' },
  { at: second - SOUND_MS.drumrollShort, effect: 'drumrollShort' },
  { at: second, effect: 'fanfareSecond' },
  { at: first - SOUND_MS.drumrollLong, effect: 'drumrollLong' },
  { at: first, music: 'podium' },
  { at: first + 300, effect: 'applause' },
]
