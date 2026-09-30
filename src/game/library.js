/* Biblioteca personal del docente: sus versiones editadas de las actividades.

   libraries/$uid/sets/$setId = { questions: [...], updatedAt }

   Una actividad editada REEMPLAZA a la original solo para ese docente; borrar el
   nodo la restaura. Guardar la lista completa (y no parches por pregunta) evita
   que una edición caiga en la pregunta equivocada si la biblioteca base cambia. */

import { WH_TYPES, isChoice, normalize } from './logic.js'

export const MAX_QUESTIONS = 15
export const MIN_OPTIONS = 3
export const MAX_OPTIONS = 4

export const libraryPath = (uid) => `libraries/${uid}/sets`

/* Firebase no guarda listas vacías ni conserva el tipo "lista" si faltan
   posiciones: se rearman al leer. */
const list = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [])

export function normalizeQuestion(q) {
  if (q && (q.options || q.answer != null)) {
    return { prompt: q.prompt ?? '', answer: q.answer ?? '', options: list(q.options) }
  }
  return {
    prompt: q?.prompt ?? '', wh: q?.wh ?? 'place', example: q?.example ?? '',
    subject: { accept: list(q?.subject?.accept), distractors: list(q?.subject?.distractors) },
    verb: { accept: list(q?.verb?.accept), distractors: list(q?.verb?.distractors) },
  }
}

export function applyLibrary(set, custom) {
  const questions = list(custom?.questions).map(normalizeQuestion)
  return questions.length ? { ...set, questions, custom: true } : set
}

/* Errores de UNA pregunta, en palabras para el docente. [] = se puede guardar. */
export function questionErrors(q) {
  const errors = []
  if (!q.prompt?.trim()) errors.push('Falta la pregunta.')
  if (isChoice(q)) {
    const options = q.options.map((o) => o.trim())
    if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) errors.push(`Debe tener de ${MIN_OPTIONS} a ${MAX_OPTIONS} alternativas.`)
    if (options.some((o) => !o)) errors.push('Hay una alternativa vacía.')
    if (new Set(options.map(normalize)).size !== options.length) errors.push('Hay alternativas repetidas.')
    if (!options.includes(q.answer?.trim())) errors.push('Marca cuál es la alternativa correcta.')
    return errors
  }
  if (!WH_TYPES[q.wh]) errors.push('Elige qué tipo de dato pide la pregunta.')
  for (const [part, label] of [['subject', 'sujeto'], ['verb', 'verbo']]) {
    const accept = q[part].accept.map((a) => a.trim()).filter(Boolean)
    if (!accept.length) errors.push(`Falta al menos un ${label} correcto.`)
    const clash = q[part].distractors.find((d) => accept.map(normalize).includes(normalize(d)))
    if (clash) errors.push(`“${clash}” es ${label} correcto y trampa a la vez.`)
  }
  return errors
}

export function setErrors(questions) {
  if (!questions.length) return ['La actividad necesita al menos una pregunta.']
  if (questions.length > MAX_QUESTIONS) return [`Máximo ${MAX_QUESTIONS} preguntas.`]
  return []
}
