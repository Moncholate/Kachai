import { describe, expect, it } from 'vitest'
import { buildReport, reportCsv } from './report.js'
import { mc } from './logic.js'

const choice = [mc('Q1', 'a', 'b', 'c'), mc('Q2', 'a', 'b', 'c'), mc('Q3', 'a', 'b', 'c'), mc('Q4', 'a', 'b', 'c')]
const h = (ok, choice, gain = 500) => ({ parts: [ok], gain: ok ? gain : 0, answer: choice == null ? null : { choice } })
const players = { ana: { name: 'Ana' }, ben: { name: 'Ben' }, cata: { name: 'Cata' } }
const scores = {
  ana: { total: 2000, history: { q0: h(true, 'a'), q1: h(true, 'a'), q2: h(true, 'a'), q3: h(true, 'a') } },
  ben: { total: 1000, history: { q0: h(false, 'b'), q1: h(false, 'b'), q2: h(true, 'a'), q3: h(true, 'a') } },
  cata: { total: 0, history: { q0: h(false, 'b'), q1: h(false, null), q2: h(false, 'c'), q3: h(false, 'c') } },
}

describe('resumen del curso', () => {
  const r = buildReport(choice, players, scores)

  it('indicadores generales: acierto y participación del curso', () => {
    expect(r.overall).toEqual({ students: 3, questions: 4, accuracy: 50, participation: 92 })
  })

  it('por pregunta: % de acierto y el error más común', () => {
    expect(r.questions[0]).toMatchObject({ correctRate: 33, topWrong: { text: 'b', count: 2 } })
    expect(r.questions[1].answeredRate).toBe(67)
    expect(r.hardest.map((q) => q.index)).toEqual([0, 1, 2])
    const noAnswers = buildReport([mc('Q', 'a', 'b', 'c')], { a: { name: 'A' } }, { a: { total: 0, history: { q0: h(false, null) } } })
    expect(noAnswers.hardest).toEqual([])
  })

  it('destacados en positivo: MVP, todo correcto, racha, quien más mejoró', () => {
    expect(r.highlights.mvp).toEqual({ name: 'Ana', total: 2000 })
    expect(r.highlights.perfect).toEqual(['Ana'])
    expect(r.highlights.streak).toEqual({ name: 'Ana', streak: 4 })
    expect(r.highlights.improved).toEqual({ name: 'Ben', improvement: 100 }) // 0% → 100% entre mitades
  })

  it('detalle por alumno: en qué preguntas falló', () => {
    expect(r.students.find((s) => s.name === 'Ben')).toMatchObject({ correct: 2, answered: 4, missed: [1, 2] })
    expect(r.students.find((s) => s.name === 'Cata').answered).toBe(3)
  })

  it('Answer Builder: acierto por parte y la más difícil', () => {
    const q = { prompt: 'Where is Tom from?', wh: 'place', subject: { accept: ['Tom'], distractors: [] }, verb: { accept: ['is'], distractors: [] } }
    const b = buildReport([q], { a: { name: 'A' }, b: { name: 'B' } }, {
      a: { total: 900, history: { q0: { parts: [true, true, true], gain: 900, answer: { subject: 'Tom', verb: 'is', wh: 'place' } } } },
      b: { total: 300, history: { q0: { parts: [true, false, true], gain: 300, answer: { subject: 'Tom', verb: 'are', wh: 'place' } } } },
    })
    expect(b.parts).toEqual({ subject: 100, verb: 50, wh: 100 })
    expect(b.weakestPart).toBe('verb')
    expect(b.questions[0].weakestPart).toBe('verb')
  })

  it('CSV: una fila por alumno y la leyenda de preguntas', () => {
    const csv = reportCsv(r, 'Básico I · EA1')
    expect(csv.split('\n')[1]).toBe('"Student","Points","Fully correct","Answered","Q1","Q2","Q3","Q4"')
    expect(csv).toContain('"Ben","1000","2/4","4/4","x","x","ok","ok"')
    expect(csv).toContain('"Q1","Q1","a","33% correct"')
  })
})
