/* Modo equipos: cada alumno responde en su celular y su equipo compite con el
   PROMEDIO de los puntos de sus integrantes. Con la suma ganaría siempre el
   equipo más grande; con el promedio compiten parejo, y quien no responde
   aporta 0 y baja la nota del equipo (motiva a que todos contesten).

   Dónde vive cada cosa (sin tocar las reglas de Firebase):
     meta.teams            { [teamId]: { name, emoji } }   lo escribe el profesor
     players/$pid/team     teamId                          lo escribe el alumno al elegir,
                                                           o el profesor al repartir */

export const TEAM_MIN = 2
export const TEAM_MAX = 6

/* Clases literales para que Tailwind las encuentre. */
export const TEAM_PRESETS = [
  { id: 'foxes', emoji: '🦊', name: 'Foxes', tint: 'bg-orange-50', border: 'border-orange-400', solid: 'bg-orange-500' },
  { id: 'pandas', emoji: '🐼', name: 'Pandas', tint: 'bg-slate-100', border: 'border-slate-500', solid: 'bg-slate-700' },
  { id: 'dolphins', emoji: '🐬', name: 'Dolphins', tint: 'bg-sky-50', border: 'border-sky-400', solid: 'bg-sky-500' },
  { id: 'frogs', emoji: '🐸', name: 'Frogs', tint: 'bg-green-50', border: 'border-green-500', solid: 'bg-green-600' },
  { id: 'owls', emoji: '🦉', name: 'Owls', tint: 'bg-violet-50', border: 'border-violet-400', solid: 'bg-violet-600' },
  { id: 'lions', emoji: '🦁', name: 'Lions', tint: 'bg-amber-50', border: 'border-amber-400', solid: 'bg-amber-500' },
  { id: 'octopuses', emoji: '🐙', name: 'Octopuses', tint: 'bg-pink-50', border: 'border-pink-400', solid: 'bg-pink-500' },
  { id: 'tigers', emoji: '🐯', name: 'Tigers', tint: 'bg-yellow-50', border: 'border-yellow-400', solid: 'bg-yellow-500' },
  { id: 'unicorns', emoji: '🦄', name: 'Unicorns', tint: 'bg-fuchsia-50', border: 'border-fuchsia-400', solid: 'bg-fuchsia-500' },
  { id: 'penguins', emoji: '🐧', name: 'Penguins', tint: 'bg-cyan-50', border: 'border-cyan-400', solid: 'bg-cyan-600' },
]
export const MAX_TEAMS = TEAM_PRESETS.length

export const presetOf = (teamId) => TEAM_PRESETS.find((t) => t.id === teamId) ?? TEAM_PRESETS[0]

/* Los primeros `count` equipos, conservando nombres ya editados. */
export function makeTeams(count, current = {}) {
  return Object.fromEntries(TEAM_PRESETS.slice(0, count).map((t) =>
    [t.id, current[t.id] ?? { name: t.name, emoji: t.emoji }]))
}

/* Cuántos equipos proponer: grupos de ~4, al menos 2. */
export const suggestTeamCount = (players) => Math.min(MAX_TEAMS, Math.max(2, Math.round(players / 4)))

/* Orden estable de los equipos (el de los presets). */
export const teamIdsOf = (teams) => TEAM_PRESETS.map((t) => t.id).filter((id) => teams?.[id])

export function membersOf(teamId, players) {
  return Object.keys(players).filter((id) => players[id].team === teamId)
}

/* Reparte al azar y parejo: los tamaños difieren a lo más en 1. */
export function shuffleIntoTeams(playerIds, teamIds, rand = Math.random) {
  const ids = [...playerIds]
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return Object.fromEntries(ids.map((id, i) => [id, teamIds[i % teamIds.length]]))
}

/* Para los atrasados: el equipo con menos integrantes (a igualdad, el primero). */
export function smallestTeam(teamIds, players) {
  let best = null
  for (const id of teamIds) {
    const n = membersOf(id, players).length
    if (best == null || n < best.n) best = { id, n }
  }
  return best?.id ?? null
}

/* Ranking de equipos por promedio. Los equipos vacíos no compiten. */
export function teamRanking(teams, players, scores) {
  return teamIdsOf(teams)
    .map((id) => {
      const members = membersOf(id, players)
      const avg = (key) => (members.length
        ? Math.round(members.reduce((sum, m) => sum + (scores[m]?.[key] || 0), 0) / members.length)
        : 0)
      return { id, name: `${teams[id].emoji} ${teams[id].name}`, members, total: avg('total'), gain: avg('gain') }
    })
    .filter((t) => t.members.length > 0)
    .sort((a, b) => b.total - a.total)
}

/* Mejor jugador individual, para destacarlo cuando se juega en equipos. */
export function mvpOf(players, scores) {
  let best = null
  for (const id of Object.keys(players)) {
    const total = scores[id]?.total || 0
    if (total > 0 && (!best || total > best.total)) best = { id, name: players[id].name, total }
  }
  return best
}
