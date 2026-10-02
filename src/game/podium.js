/* Guion de la revelación final, en ms desde que empieza la fase 'end'. El
   proyector y los celulares lo calculan con el mismo reloj (el del servidor),
   así que nadie ve su puesto antes de que aparezca en la pantalla. */
export const PODIUM_AT = {
  third: 1800,
  second: 4800,
  drumroll: 7000, // "And the winner is…" mientras suena el redoble
  first: 8700,
  rest: 11000, // del 4.º lugar hacia abajo, y el botón "Jugar otra vez"
}

export function podiumStage(startedAt, now) {
  const t = typeof startedAt === 'number' ? now - startedAt : -1
  return Object.fromEntries(Object.entries(PODIUM_AT).map(([k, at]) => [k, t >= at]))
}

/* El efecto 'reveal' (3,2 s) es un redoble de 1,7 s seguido de un remate
   brillante: la "fanfarria corta". */
export const REVEAL_STING_MS = 1700

/* Sonidos del podio, pedidos por la profesora:
     3.º y 2.º   la fanfarria corta, con el remate justo cuando aparece el puesto
     1.º         solo el redoble, cortado antes del remate; al aparecer el campeón
                 entra la fanfarria larga (el tema 'podium') sin nada encima */
export const PODIUM_SOUNDS = [
  { at: PODIUM_AT.third - REVEAL_STING_MS, effect: 'reveal' },
  { at: PODIUM_AT.second - REVEAL_STING_MS, effect: 'reveal' },
  { at: PODIUM_AT.first - REVEAL_STING_MS, effect: 'reveal', stopAt: PODIUM_AT.first },
]
