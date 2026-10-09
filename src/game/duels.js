/* Duelos en el ranking: dos puestos seguidos separados por menos de lo que se
   gana en una pregunta. El VS significa literalmente "en la próxima pregunta
   este puesto puede cambiar".

   El proyector arma el tablero (buildBoard) al abrir el ranking y lo publica en
   state.board, así los celulares muestran exactamente lo mismo. Sirve igual para
   alumnos y para equipos: solo necesita filas { id, name, total } ordenadas. */

export const DUEL_GAP = 500 // una respuesta correcta vale entre 500 y 1000
export const PHOTO_FINISH = 100 // tan cerca que se marca en rojo
export const MAX_DUELS = 2 // en el proyector, para no llenar la pantalla de VS
export const BOARD_SIZE = 10 // el proyector muestra el top 10

/* hero: el personaje que eligió (game/heroes.js), para dibujar el duelo en su celular. */
const row = (r) => ({ id: r.id, name: r.name, total: r.total, ...(r.hero ? { hero: r.hero } : {}) })

/* Los duelos más cerrados, sin que un mismo puesto esté en dos, en orden de tabla. */
/* `reach` = lo que se puede ganar en la próxima pregunta: con el 2X activado,
   el doble, y aparecen más VS. */
export function findDuels(ranking, max = MAX_DUELS, reach = DUEL_GAP) {
  const pairs = []
  for (let i = 0; i + 1 < ranking.length; i++) {
    const [upper, lower] = [ranking[i], ranking[i + 1]]
    const gap = upper.total - lower.total
    if (upper.total > 0 && gap < reach) pairs.push({ place: i + 1, upper: row(upper), lower: row(lower), gap, photo: gap < PHOTO_FINISH })
  }
  const chosen = []
  for (const p of pairs.sort((a, b) => a.gap - b.gap || a.place - b.place)) {
    if (chosen.length >= max) break
    if (chosen.some((c) => Math.abs(c.place - p.place) < 2)) continue
    chosen.push(p)
  }
  return chosen.sort((a, b) => a.place - b.place)
}

/* Duelos anunciados en el ranking anterior que se dieron vuelta en este. */
export function findOvertakes(previousDuels, ranking) {
  const pos = Object.fromEntries(ranking.map((r, i) => [r.id, i]))
  return previousDuels
    .filter((d) => pos[d.lower.id] != null && pos[d.upper.id] != null && pos[d.lower.id] < pos[d.upper.id])
    .map((d) => ({ who: d.lower, over: d.upper }))
}

/* El desafío de cada uno, para su celular: alcanzar al de arriba si está a tiro;
   si no, defenderse del de abajo. Toda la tabla, no solo el top 10. */
export function personalDuels(ranking, reach = DUEL_GAP) {
  const out = {}
  ranking.forEach((me, i) => {
    const ahead = ranking[i - 1]
    const behind = ranking[i + 1]
    if (ahead && ahead.total > 0 && ahead.total - me.total < reach) out[me.id] = { rival: ahead.name, gap: ahead.total - me.total, ahead: true, ...(ahead.hero ? { rivalHero: ahead.hero } : {}) }
    else if (behind && me.total > 0 && me.total - behind.total < reach) out[me.id] = { rival: behind.name, gap: me.total - behind.total, ahead: false, ...(behind.hero ? { rivalHero: behind.hero } : {}) }
  })
  return out
}

/* Todo lo que muestra el ranking:
     duels       los VS del proyector (top 10, máx. 2)
     overtakes   duelos del ranking anterior que se dieron vuelta
     finalDuel   el 1.º y el 2.º en duelo justo antes de la última pregunta
     personal    { id: { rival, gap, ahead } } para cada celular */
export function buildBoard(ranking, previousRanking, beforeLastQuestion, reach = DUEL_GAP) {
  const duels = findDuels(ranking.slice(0, BOARD_SIZE), MAX_DUELS, reach)
  const previousDuels = previousRanking ? findDuels(previousRanking.slice(0, BOARD_SIZE)) : []
  const top = duels.find((d) => d.place === 1)
  return {
    duels,
    overtakes: findOvertakes(previousDuels, ranking),
    finalDuel: beforeLastQuestion && top ? top : null,
    personal: personalDuels(ranking, reach),
  }
}

/* El ranking tal como estaba antes de la última pregunta: total menos lo ganado. */
export const previousTotals = (ranking) =>
  [...ranking].map((r) => ({ ...r, total: r.total - (r.gain || 0) })).sort((a, b) => b.total - a.total)
