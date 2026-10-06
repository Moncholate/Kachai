import { describe, expect, it } from 'vitest'
import { buildBoard, findDuels, findOvertakes, personalDuels, previousTotals } from './duels.js'

const r = (id, total, gain = 0) => ({ id, name: id.toUpperCase(), total, gain })

describe('duelos', () => {
  it('VS solo entre puestos seguidos a menos de 500 pts; los más cerrados primero, sin repetir puesto', () => {
    const ranking = [r('a', 3000), r('b', 2900), r('c', 2850), r('d', 1500), r('e', 1450)]
    const duels = findDuels(ranking)
    // b–c (50) y d–e (50) son los más cerrados; a–b (100) queda fuera porque b ya está en un duelo
    expect(duels.map((d) => [d.upper.id, d.lower.id, d.gap])).toEqual([['b', 'c', 50], ['d', 'e', 50]])
    expect(duels[0].photo).toBe(true)
    expect(findDuels([r('a', 0), r('b', 0)])).toEqual([]) // empatados en 0 no es un duelo
    expect(findDuels([r('a', 2000), r('b', 1400)])).toEqual([])
  })

  it('anuncia el adelantamiento cuando el de atrás supera al de adelante', () => {
    const before = [r('a', 1000), r('b', 900)]
    const duels = findDuels(before)
    expect(findOvertakes(duels, [r('b', 1800), r('a', 1500)])).toEqual([{ who: duels[0].lower, over: duels[0].upper }])
    expect(findOvertakes(duels, [r('a', 1900), r('b', 1800)])).toEqual([])
  })

  it('cada celular tiene su desafío: alcanzar al de arriba o defenderse del de abajo', () => {
    const p = personalDuels([r('a', 3000), r('b', 2900), r('c', 1000), r('d', 950), r('e', 100)])
    expect(p.a).toEqual({ rival: 'B', gap: 100, ahead: false })
    expect(p.b).toEqual({ rival: 'A', gap: 100, ahead: true })
    expect(p.c).toEqual({ rival: 'D', gap: 50, ahead: false })
    expect(p.d).toEqual({ rival: 'C', gap: 50, ahead: true })
    expect(p.e).toBeUndefined()
  })

  it('duelo final: 1.º y 2.º peleados justo antes de la última pregunta', () => {
    const now = [r('a', 3000, 900), r('b', 2950, 1000)]
    expect(buildBoard(now, previousTotals(now), true).finalDuel).toMatchObject({ place: 1, gap: 50 })
    expect(buildBoard(now, previousTotals(now), false).finalDuel).toBeNull()
  })

  it('el ranking anterior se reconstruye restando lo ganado en la pregunta', () => {
    expect(previousTotals([r('a', 1800, 900), r('b', 1500, 200)]).map((x) => [x.id, x.total])).toEqual([['b', 1300], ['a', 900]])
  })

  it('con 2X el alcance se duplica: aparecen VS que antes no estaban', () => {
    const ranking = [r('a', 2000), r('b', 1300)]
    expect(buildBoard(ranking, null, true).finalDuel).toBe(null)
    expect(buildBoard(ranking, null, true, 1000).finalDuel.gap).toBe(700)
    expect(buildBoard(ranking, null, true, 1000).personal.b).toEqual({ rival: 'A', gap: 700, ahead: true })
  })
})
