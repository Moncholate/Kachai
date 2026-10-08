import { describe, expect, it } from 'vitest'
import { ROOM_LIFE_MS, isOld, oldRooms, removeIfSame } from './cleanup.js'

const H = 60 * 60 * 1000

describe('salas que quedaron abiertas', () => {
  it('una sala es vieja después de 12 horas', () => {
    expect(ROOM_LIFE_MS).toBe(12 * H)
    expect(isOld(0, 13 * H)).toBe(true)
    expect(isOld(0, 11 * H)).toBe(false)
    expect(isOld(undefined, 99 * H)).toBe(false)
  })

  it('nunca se borra la sala en uso, aunque sea vieja', () => {
    expect(oldRooms({ 111111: 0, 222222: 0, 333333: 20 * H }, 24 * H, '222222').map(([pin]) => pin)).toEqual(['111111'])
  })

  const fakeStore = (rooms) => {
    const removed = []
    return { removed, get: async (path) => rooms[path.split('/')[1]] ?? null, remove: async (path) => { removed.push(path) } }
  }

  it('borra la sala si sigue siendo la misma que se abrió', async () => {
    const s = fakeStore({ 111111: { createdAt: 5 } })
    await removeIfSame(s, '111111', 5)
    expect(s.removed).toEqual(['rooms/111111'])
  })

  it('no borra si hoy ese PIN es la sala de otro docente, ni si ya no existe', async () => {
    const s = fakeStore({ 111111: { createdAt: 999 } })
    await removeIfSame(s, '111111', 5)
    await removeIfSame(s, '222222', 5)
    expect(s.removed).toEqual([])
  })
})
