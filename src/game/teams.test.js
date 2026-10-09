import { describe, expect, it } from 'vitest'
import { makeTeams, mvpOf, shuffleIntoTeams, smallestTeam, suggestTeamCount, teamIdsOf, teamRanking, streaksOf } from './teams.js'

const players = {
  a: { name: 'Ana', team: 'foxes' },
  b: { name: 'Ben', team: 'foxes' },
  c: { name: 'Cata', team: 'pandas' },
  d: { name: 'Dani', team: 'pandas' },
  e: { name: 'Eli', team: 'pandas' },
  f: { name: 'Fran' },
}

describe('teams', () => {
  it('makeTeams conserva los nombres ya editados', () => {
    const teams = makeTeams(3, { foxes: { name: 'Los Zorros', emoji: '🦊' } })
    expect(teamIdsOf(teams)).toEqual(['foxes', 'pandas', 'dolphins'])
    expect(teams.foxes.name).toBe('Los Zorros')
  })

  it('reparte parejo: los tamaños difieren a lo más en 1', () => {
    const ids = Array.from({ length: 11 }, (_, i) => `p${i}`)
    const assigned = shuffleIntoTeams(ids, ['foxes', 'pandas', 'dolphins'])
    const sizes = ['foxes', 'pandas', 'dolphins'].map((t) => ids.filter((id) => assigned[id] === t).length)
    expect(sizes.reduce((a, b) => a + b)).toBe(11)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  })

  it('los atrasados van al equipo más pequeño', () => {
    expect(smallestTeam(['foxes', 'pandas'], players)).toBe('foxes')
    expect(smallestTeam(['foxes', 'pandas', 'dolphins'], players)).toBe('dolphins')
  })

  it('el equipo compite con el PROMEDIO, así el tamaño no da ventaja', () => {
    const teams = makeTeams(3)
    const scores = { a: { total: 900, gain: 900 }, b: { total: 700, gain: 100 }, c: { total: 1000 }, d: { total: 500 }, e: {} }
    const ranking = teamRanking(teams, players, scores)
    // Aventureros (900 + 700) / 2 = 800 le gana a Caballeros (1000 + 500 + 0) / 3 = 500, aunque sumen igual
    expect(ranking.map((t) => [t.id, t.total])).toEqual([['foxes', 800], ['pandas', 500]])
    expect(ranking[0].gain).toBe(500)
    // Dolphins no tiene integrantes: no compite
    expect(ranking.find((t) => t.id === 'dolphins')).toBeUndefined()
  })

  it('MVP: el mejor individual, y nadie si todos tienen 0', () => {
    expect(mvpOf(players, { c: { total: 1000 }, a: { total: 900 } })).toEqual({ id: 'c', name: 'Cata', total: 1000 })
    expect(mvpOf(players, {})).toBeNull()
  })

  it('propone equipos de ~4, al menos 2', () => {
    expect(suggestTeamCount(0)).toBe(2)
    expect(suggestTeamCount(16)).toBe(4)
    expect(suggestTeamCount(30)).toBe(8)
  })
})

describe('rachas dentro de un equipo', () => {
  const players = { a: { name: 'Ana' }, b: { name: 'Beto' }, c: { name: 'Caro' }, d: { name: 'Dani' } }
  const scores = { a: { streak: 3 }, b: { streak: 6 }, c: { streak: 2 }, d: { streak: 5 } }

  it('muestra a los que van en racha, de la más larga a la más corta', () => {
    expect(streaksOf(['a', 'b', 'c', 'd'], players, scores).map((m) => [m.name, m.streak])).toEqual([['Beto', 6], ['Dani', 5], ['Ana', 3]])
  })

  it('marca como nueva a quien acaba de llegar a 3, 5, 10…: es a quien anuncia el sonido', () => {
    const r = Object.fromEntries(streaksOf(['a', 'b', 'd'], players, scores).map((m) => [m.name, m.nueva]))
    expect(r).toEqual({ Ana: true, Beto: false, Dani: true })
  })

  it('sin rachas, nada', () => {
    expect(streaksOf(['c'], players, scores)).toEqual([])
  })
})
