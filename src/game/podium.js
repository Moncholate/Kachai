/* Guion de la revelación final, en ms desde que empieza la fase 'end'. El
   proyector y los celulares lo calculan con el mismo reloj (el del servidor),
   así que nadie ve su puesto antes de que aparezca en la pantalla. */
export const PODIUM_AT = {
  third: 1500,
  second: 4500,
  drumroll: 7000, // redoble: su golpe final cae justo cuando aparece el primero
  first: 8700,
  rest: 11000, // del 4.º lugar hacia abajo, y el botón "Jugar otra vez"
}

export function podiumStage(startedAt, now) {
  const t = typeof startedAt === 'number' ? now - startedAt : -1
  return Object.fromEntries(Object.entries(PODIUM_AT).map(([k, at]) => [k, t >= at]))
}
