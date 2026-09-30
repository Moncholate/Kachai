import { describe, expect, it } from 'vitest'
import { buildPublicQuestion, checkAnswer, nextStreak, normalize, scoreFor, splitWh, WH_TYPES } from './logic.js'
import { COURSES, SETS, getSet } from './sets.js'

const q = { prompt: 'Where did María work yesterday?', wh: 'place', example: 'She worked at the hospital.',
  subject: { accept: ['María', 'She'], distractors: ['He', 'Yesterday', 'They'] },
  verb: { accept: ['worked'], distractors: ['work', 'works', 'did work'] } }

describe('checkAnswer', () => {
  it('acepta nombre o pronombre, sin importar tildes ni mayúsculas', () => {
    expect(checkAnswer(q, { subject: 'maria', verb: 'WORKED', wh: 'place' })).toEqual([true, true, true])
    expect(checkAnswer(q, { subject: ' she ', verb: 'worked', wh: 'place' })).toEqual([true, true, true])
  })
  it('marca cada parte por separado', () => {
    expect(checkAnswer(q, { subject: 'He', verb: 'did work', wh: 'place' })).toEqual([false, false, true])
    expect(checkAnswer(q, {})).toEqual([false, false, false])
  })
})

describe('scoreFor', () => {
  it('1000 si todo es correcto al instante, 500 en el último segundo', () => {
    expect(scoreFor([true, true, true], 0, 30000)).toBe(1000)
    expect(scoreFor([true, true, true], 30000, 30000)).toBe(500)
  })
  it('cada parte vale un tercio y nada correcto vale 0', () => {
    expect(scoreFor([true, false, false], 0, 30000)).toBe(333)
    expect(scoreFor([false, false, false], 0, 30000)).toBe(0)
  })
})

describe('normalize', () => {
  it('limpia tildes, apóstrofes curvos y espacios', () => {
    expect(normalize('  María’s  ')).toBe("maria's")
  })
})

describe('splitWh', () => {
  it('reconoce wh compuestas', () => {
    expect(splitWh('How many cats does Peter have?')[0]).toBe('How many')
    expect(splitWh('What time do you get up?')[0]).toBe('What time')
    expect(splitWh('Where does Tom live?')[0]).toBe('Where')
  })
})

describe('sets', () => {
  for (const set of SETS) {
    for (const item of [set.practice, ...set.questions]) {
      it(`${set.id} · ${item.prompt}`, () => {
        expect(WH_TYPES[item.wh]).toBeDefined()
        for (const part of ['subject', 'verb']) {
          const accept = item[part].accept.map(normalize)
          expect(accept.length).toBeGreaterThan(0)
          // una trampa nunca puede ser también respuesta válida
          for (const d of item[part].distractors) expect(accept).not.toContain(normalize(d))
        }
        const pub = buildPublicQuestion(item)
        expect(pub.whOptions).toContain(item.wh)
        expect(new Set(pub.whOptions).size).toBe(4)
        // lo que viaja a los celulares no lleva la solución
        expect(JSON.stringify(pub)).not.toContain('accept')
      })
    }
  }
})

describe('biblioteca', () => {
  it('9 cursos, cada uno con EA1 y EA2 con preguntas', () => {
    expect(COURSES).toHaveLength(9)
    for (const c of COURSES) {
      expect(c.eas.map((e) => e.ea)).toEqual(['EA1', 'EA2'])
      for (const e of c.eas) expect(e.questions.length).toBeGreaterThanOrEqual(10)
    }
  })
  it('ids únicos y sin preguntas repetidas dentro de un set', () => {
    expect(new Set(SETS.map((s) => s.id)).size).toBe(SETS.length)
    for (const s of SETS) expect(new Set(s.questions.map((x) => x.prompt)).size).toBe(s.questions.length)
  })
  it('cada set practica al menos 4 tipos de wh distintos', () => {
    for (const s of SETS) expect(new Set(s.questions.map((x) => x.wh)).size).toBeGreaterThanOrEqual(4)
  })
  it('cada set tiene su pregunta de práctica, distinta de las del juego', () => {
    for (const s of SETS) {
      expect(s.practice).toBeDefined()
      expect(s.questions.map((x) => x.prompt)).not.toContain(s.practice.prompt)
    }
  })
  it('un setId viejo o desconocido cae en el primero', () => {
    expect(getSet('a1')).toBe(SETS[0])
  })
})

describe('nextStreak', () => {
  it('suma solo con las tres partes bien y se corta con cualquier fallo', () => {
    expect(nextStreak(undefined, [true, true, true])).toBe(1)
    expect(nextStreak(2, [true, true, true])).toBe(3)
    expect(nextStreak(5, [true, true, false])).toBe(0)
    expect(nextStreak(5, [false, false, false])).toBe(0)
  })
})
