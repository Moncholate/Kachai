import { describe, expect, it } from 'vitest'
import { IDIOMAS, TEXTOS, nombreEquipo, traducir } from './i18n.jsx'
import { WH_TYPES } from './game/logic.js'
import { TEAM_PRESETS } from './game/teams.js'
import { questionErrors, setErrors } from './game/library.js'

describe('textos en español e inglés', () => {
  it('cada texto existe en los dos idiomas, y del mismo tipo', () => {
    for (const [clave, v] of Object.entries(TEXTOS)) {
      for (const l of IDIOMAS) expect(v[l], `${clave}.${l}`).toBeDefined()
      expect(typeof v.en, clave).toBe(typeof v.es)
    }
  })

  it('cada tipo de información y cada equipo tiene su texto', () => {
    for (const k of Object.keys(WH_TYPES)) {
      expect(TEXTOS[`wh_${k}`], k).toBeDefined()
      expect(TEXTOS[`wh_${k}`].en, k).toBe(WH_TYPES[k])
    }
    for (const t of TEAM_PRESETS) {
      expect(TEXTOS[`equipo_${t.id}`], t.id).toBeDefined()
      expect(TEXTOS[`equipo_${t.id}`].en, t.id).toBe(t.name)
    }
  })

  it('sin idioma válido, inglés: como se veía todo lo del estudiante', () => {
    expect(traducir(undefined, 'estasDentro', 'Ana')).toBe("You're in, Ana!")
    expect(traducir('es', 'estasDentro', 'Ana')).toBe('¡Estás dentro, Ana!')
  })

  it('el equipo se traduce, salvo que el profesor le haya puesto otro nombre', () => {
    const t = (k, ...a) => traducir('es', k, ...a)
    expect(nombreEquipo(t, 'foxes', { name: 'Foxes' })).toBe('Zorros')
    expect(nombreEquipo(t, 'foxes', { name: 'Los Cracks' })).toBe('Los Cracks')
  })

  it('los errores del editor salen en el idioma pedido, y en español sin idioma', () => {
    const vacia = { prompt: '', answer: 'a', options: ['a', 'b', 'c'] }
    expect(questionErrors(vacia)).toContain('Falta la pregunta.')
    expect(questionErrors(vacia, 'en')).toContain('The question is missing.')
    expect(setErrors([], 'en')[0]).toMatch(/at least one question/)
  })
})
