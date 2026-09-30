/* Biblioteca personal del docente, en libraries/$uid:

     sets/$setId              { questions, updatedAt }   su versión de una actividad base
     custom/$id               { title, mechanic, course, ea, count, updatedAt }
     customQuestions/$id      [ ...preguntas ]           actividades creadas desde cero

   Una actividad base editada la REEMPLAZA solo para ese docente; borrar el nodo
   la restaura. Se guarda la lista completa (no parches por pregunta) para que una
   edición no caiga en la pregunta equivocada si la biblioteca base cambia.

   Las actividades propias separan índice y preguntas: el lobby lista todas sin
   descargar las preguntas (que pueden traer imágenes); esas bajan solo al elegirla. */

import { WH_TYPES, isChoice, normalize } from './logic.js'

export const MAX_QUESTIONS = 15
export const MIN_OPTIONS = 3
export const MAX_OPTIONS = 4
/* Imagen en la pregunta: la de un archivo va comprimida como data URL dentro
   de la base (Firebase Storage exige plan de pago); también sirve un enlace https. */
/* ~150 KB por imagen (base64 ocupa ~4/3 del archivo): el GB gratuito rinde ~13.000. */
export const MAX_IMAGE_CHARS = 205_000
export const MAX_IMAGE_SIDE = 800

export const libraryPath = (uid) => `libraries/${uid}/sets`
export const customIndexPath = (uid) => `libraries/${uid}/custom`
export const customQuestionsPath = (uid, id) => `libraries/${uid}/customQuestions/${id}`

export const isCustomId = (id) => typeof id === 'string' && id.startsWith('custom-')
export const newCustomId = () => `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/* Firebase no guarda listas vacías ni conserva el tipo "lista" si faltan
   posiciones: se rearman al leer. */
const list = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [])

export function normalizeQuestion(q) {
  const image = q?.image ? { image: q.image } : {}
  if (q && (q.options || q.answer != null)) {
    return { prompt: q.prompt ?? '', answer: q.answer ?? '', options: list(q.options), ...image }
  }
  return {
    prompt: q?.prompt ?? '', wh: q?.wh ?? 'place', example: q?.example ?? '',
    subject: { accept: list(q?.subject?.accept), distractors: list(q?.subject?.distractors) },
    verb: { accept: list(q?.verb?.accept), distractors: list(q?.verb?.distractors) },
    ...image,
  }
}

export function applyLibrary(set, custom) {
  const questions = list(custom?.questions).map(normalizeQuestion)
  return questions.length ? { ...set, questions, custom: true } : set
}

/* Una actividad propia con la misma forma que las de la biblioteca base, para
   que el juego y el lobby no tengan que distinguirlas. */
export function customSet(id, info, questions) {
  return {
    id, type: 'custom', mine: true, mechanic: info.mechanic, title: info.title,
    course: info.course, ea: `EA${(info.ea ?? 0) + 1}`,
    questions: list(questions).map(normalizeQuestion),
  }
}

export function imageError(image) {
  if (!image) return null
  if (image.startsWith('data:image/')) return image.length > MAX_IMAGE_CHARS ? 'La imagen es demasiado pesada.' : null
  return /^https:\/\/\S+$/.test(image) ? null : 'El enlace de la imagen debe empezar con https://'
}

/* Errores de UNA pregunta, en palabras para el docente. [] = se puede guardar. */
export function questionErrors(q) {
  const errors = []
  if (!q.prompt?.trim()) errors.push('Falta la pregunta.')
  const img = imageError(q.image)
  if (img) errors.push(img)
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
