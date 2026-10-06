/* Resumen del curso al final de un juego, para el profesor. Sale del historial
   que ya guarda cada puntaje (scores[id].history, ver historyEntry en logic.js):
   por pregunta, lo que respondió cada alumno, qué partes acertó y cuánto ganó. */

import { WH_TYPES, historyKey, isChoice, subjectAccept } from './logic.js'

const PART_NAMES = ['subject', 'verb', 'wh']
const asList = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [])
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)

/* `whLabel` nombra el tipo de información en el idioma de la sala; sin él, el
   rótulo en inglés de logic.js. */
export function solutionText(q, whLabel = (k) => WH_TYPES[k]) {
  if (isChoice(q)) return q.answer
  return `${subjectAccept(q).join(' / ')} · ${q.verb.accept.join(' / ')} · ${whLabel(q.wh)}`
}

/* La racha más larga de preguntas enteras bien, recorriendo el historial en orden. */
function longestStreak(entries) {
  let best = 0
  let run = 0
  for (const e of entries) {
    run = e && asList(e.parts).length && asList(e.parts).every(Boolean) ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

export function buildReport(questions, players, scores, whLabel) {
  const ids = Object.keys(players).filter((id) => scores[id])
  const n = questions.length

  const students = ids.map((id) => {
    const entries = questions.map((_, i) => scores[id].history?.[historyKey(i)] ?? null)
    const full = entries.map((e) => Boolean(e && asList(e.parts).length && asList(e.parts).every(Boolean)))
    const half = Math.floor(n / 2)
    const rate = (from, to) => pct(full.slice(from, to).filter(Boolean).length, to - from)
    return {
      id,
      name: players[id].name,
      total: scores[id].total || 0,
      correct: full.filter(Boolean).length,
      answered: entries.filter((e) => e?.answer).length,
      missed: full.map((ok, i) => (ok ? null : i + 1)).filter(Boolean),
      streak: longestStreak(entries),
      improvement: n >= 4 ? rate(half, n) - rate(0, half) : 0,
      entries,
    }
  }).sort((a, b) => b.total - a.total)

  const perQuestion = questions.map((q, i) => {
    const entries = students.map((s) => s.entries[i])
    const answered = entries.filter((e) => e?.answer)
    const fullyRight = entries.filter((e) => e && asList(e.parts).every(Boolean) && asList(e.parts).length)
    const base = {
      index: i, prompt: q.prompt, kind: isChoice(q) ? 'choice' : 'builder', solution: solutionText(q, whLabel),
      correctRate: pct(fullyRight.length, students.length), answeredRate: pct(answered.length, students.length),
    }
    if (isChoice(q)) {
      // el error más común: la alternativa incorrecta más votada
      const votes = {}
      for (const e of answered) if (e.answer.choice !== q.answer) votes[e.answer.choice] = (votes[e.answer.choice] || 0) + 1
      const [text, count] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0] ?? []
      return { ...base, topWrong: text ? { text, count } : null }
    }
    const partRates = PART_NAMES.map((_, k) => pct(answered.filter((e) => asList(e.parts)[k]).length, answered.length))
    const weakest = partRates.indexOf(Math.min(...partRates))
    return { ...base, partRates, weakestPart: answered.length && partRates[weakest] < 100 ? PART_NAMES[weakest] : null }
  })

  const cells = students.length * n
  const allEntries = students.flatMap((s) => s.entries)
  const builderEntries = questions.flatMap((q, i) => (isChoice(q) ? [] : students.map((s) => s.entries[i]).filter((e) => e?.answer)))
  const parts = builderEntries.length
    ? Object.fromEntries(PART_NAMES.map((p, k) => [p, pct(builderEntries.filter((e) => asList(e.parts)[k]).length, builderEntries.length)]))
    : null

  // si nadie alcanzó a responder una pregunta, no hay error que repasar
  const hardest = [...perQuestion].filter((q) => q.correctRate < 100 && q.answeredRate > 0)
    .sort((a, b) => a.correctRate - b.correctRate).slice(0, 3)
  const bestStreak = students.reduce((best, s) => (s.streak > (best?.streak ?? 0) ? s : best), null)
  const improver = students.reduce((best, s) => (s.improvement > (best?.improvement ?? 0) ? s : best), null)

  return {
    students: students.map(({ entries, ...s }) => s),
    questions: perQuestion,
    overall: {
      students: students.length,
      questions: n,
      accuracy: pct(students.reduce((sum, s) => sum + s.correct, 0), cells),
      participation: pct(allEntries.filter((e) => e?.answer).length, cells),
    },
    parts,
    weakestPart: parts ? PART_NAMES.reduce((a, b) => (parts[b] < parts[a] ? b : a)) : null,
    hardest,
    highlights: {
      mvp: students[0] && students[0].total > 0 ? { name: students[0].name, total: students[0].total } : null,
      perfect: students.filter((s) => n && s.correct === n).map((s) => s.name),
      streak: bestStreak && bestStreak.streak >= 3 ? { name: bestStreak.name, streak: bestStreak.streak } : null,
      improved: improver && improver.improvement >= 25 ? { name: improver.name, improvement: improver.improvement } : null,
    },
  }
}

/* CSV para el registro del profesor: una fila por alumno, una columna por pregunta. */
/* `h` = los encabezados en el idioma de la sala; sin él, en inglés. */
const CSV_EN = {
  student: 'Student', points: 'Points', fullyCorrect: 'Fully correct', answered: 'Answered',
  question: 'Question', prompt: 'Prompt', correctAnswer: 'Correct answer', classResult: 'Class result',
  pctCorrect: (p) => `${p}% correct`,
}

export function reportCsv(report, title = '', h = CSV_EN) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const head = [h.student, h.points, h.fullyCorrect, h.answered, ...report.questions.map((q) => `Q${q.index + 1}`)]
  const rows = report.students.map((s) => [
    s.name, s.total, `${s.correct}/${report.overall.questions}`, `${s.answered}/${report.overall.questions}`,
    ...report.questions.map((q) => (s.missed.includes(q.index + 1) ? 'x' : 'ok')),
  ])
  const legend = report.questions.map((q) => [`Q${q.index + 1}`, q.prompt, q.solution, h.pctCorrect(q.correctRate)])
  return [
    title ? [title] : [],
    head, ...rows, [],
    [h.question, h.prompt, h.correctAnswer, h.classResult], ...legend,
  ].map((r) => r.map(esc).join(',')).join('\n')
}
