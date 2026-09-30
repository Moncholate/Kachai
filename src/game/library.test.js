import { describe, expect, it } from 'vitest'
import { applyLibrary, normalizeQuestion, questionErrors, setErrors } from './library.js'
import { mc } from './logic.js'
import { SETS } from './sets.js'

const builder = {
  prompt: 'Where does Tom live?', wh: 'place', example: 'He lives in London.',
  subject: { accept: ['Tom', 'He'], distractors: ['She'] },
  verb: { accept: ['lives'], distractors: ['live'] },
}

describe('biblioteca personal', () => {
  it('toda la biblioteca base pasa la validación del editor', () => {
    for (const s of SETS) {
      expect(setErrors(s.questions)).toEqual([])
      for (const q of s.questions) expect(questionErrors(q)).toEqual([])
    }
  })

  it('la versión editada reemplaza a la original; sin edición, queda la original', () => {
    const base = SETS[0]
    const edited = applyLibrary(base, { questions: [mc('Q?', 'a', 'b', 'c')] })
    expect(edited.questions).toHaveLength(1)
    expect(edited.custom).toBe(true)
    expect(edited.id).toBe(base.id)
    expect(applyLibrary(base, null)).toBe(base)
  })

  it('rearma lo que Firebase devuelve: listas como objetos, listas vacías que desaparecen', () => {
    const back = normalizeQuestion({ ...builder, subject: { accept: { 0: 'Tom', 1: 'He' } }, verb: { accept: ['lives'] } })
    expect(back.subject).toEqual({ accept: ['Tom', 'He'], distractors: [] })
    expect(back.verb.distractors).toEqual([])
    expect(normalizeQuestion({ prompt: 'Q?', answer: 'a', options: { 0: 'a', 1: 'b', 2: 'c' } }).options).toEqual(['a', 'b', 'c'])
  })

  it('opción múltiple: 3–4 alternativas, sin vacías ni repetidas, con la correcta marcada', () => {
    expect(questionErrors(mc('Q?', 'a', 'b'))).toContain('Debe tener de 3 a 4 alternativas.')
    expect(questionErrors(mc('Q?', 'a', 'b', ''))).toContain('Hay una alternativa vacía.')
    expect(questionErrors(mc('Q?', 'a', 'b', 'A'))).toContain('Hay alternativas repetidas.')
    expect(questionErrors({ prompt: 'Q?', answer: 'z', options: ['a', 'b', 'c'] })).toContain('Marca cuál es la alternativa correcta.')
  })

  it('Answer Builder: sujeto y verbo correctos, y ninguna trampa que también sea correcta', () => {
    expect(questionErrors(builder)).toEqual([])
    expect(questionErrors({ ...builder, subject: { accept: [], distractors: [] } })).toContain('Falta al menos un sujeto correcto.')
    expect(questionErrors({ ...builder, verb: { accept: ['lives'], distractors: ['Lives'] } })[0]).toMatch(/verbo correcto y trampa/)
  })

  it('entre 1 y 15 preguntas', () => {
    expect(setErrors([])).not.toEqual([])
    expect(setErrors(Array(16).fill(builder))).not.toEqual([])
    expect(setErrors([builder])).toEqual([])
  })
})
