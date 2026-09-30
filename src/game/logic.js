/* Qué tipo de información pide cada wh-word. El alumno no tiene el texto, así
   que no puede dar el dato: solo puede decir QUÉ CLASE de dato va en la respuesta. */
export const WH_TYPES = {
  place: 'a place',
  time: 'a time',
  person: 'a person',
  thing: 'a thing',
  action: 'an action',
  reason: 'a reason',
  manner: 'a way / manner',
  quantity: 'a quantity',
  frequency: 'a frequency',
  duration: 'a duration',
}

export const MAX_POINTS = 1000

/* "María" = "maria" = " MARIA " · "She’s" = "she's". Así el modo escrito no
   castiga tildes, mayúsculas ni espacios, solo la forma gramatical. */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’`]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const matches = (accepted, given) => accepted.some((a) => normalize(a) === normalize(given))

export function shuffle(list, rand = Math.random) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* Dos mecánicas, reconocibles por la forma de la pregunta:
     armar            { subject, verb, wh }: sujeto + verbo + tipo de dato (Answer Builder)
     opción múltiple  { options, answer }: 1 entre 3–4 alternativas (Exam Practice, Grammar Mix) */
export const isChoice = (q) => Array.isArray(q.options)

/* Pregunta de opción múltiple: mc(prompt, correcta, ...trampas). El orden da
   igual: el profesor baraja las alternativas al lanzarla. */
export const mc = (prompt, answer, ...wrong) => ({ prompt, answer, options: [answer, ...wrong] })

/* Lo que ven los celulares: opciones barajadas, SIN la solución. La barajada la
   hace el profesor una vez, así todos ven el mismo orden. */
export function buildPublicQuestion(q, rand = Math.random) {
  /* La imagen se ve solo en el proyector (la tiene el profesor): a los celulares
     viaja apenas el aviso, para no mandar cientos de KB a cada alumno. */
  const image = q.image ? { hasImage: true } : {}
  if (isChoice(q)) return { kind: 'choice', prompt: q.prompt, options: shuffle(q.options, rand), ...image }
  const whOthers = shuffle(Object.keys(WH_TYPES).filter((k) => k !== q.wh), rand).slice(0, 3)
  return {
    kind: 'builder', ...image,
    prompt: q.prompt,
    subjectOptions: shuffle([...q.subject.accept, ...q.subject.distractors], rand),
    verbOptions: shuffle([...q.verb.accept, ...q.verb.distractors], rand),
    whOptions: shuffle([q.wh, ...whOthers], rand),
  }
}

export function solutionOf(q) {
  if (isChoice(q)) return { answer: q.answer }
  return { subject: q.subject.accept, verb: q.verb.accept, wh: q.wh, example: q.example ?? null }
}

/* → partes acertadas como booleanos: [sujeto, verbo, wh] o [alternativa] */
export function checkAnswer(q, answer) {
  if (isChoice(q)) return [answer?.choice === q.answer]
  return [
    matches(q.subject.accept, answer?.subject),
    matches(q.verb.accept, answer?.verb),
    answer?.wh === q.wh,
  ]
}

/* Como Kahoot: cada parte correcta vale su fracción, y la rapidez multiplica entre
   ×1 (al instante) y ×0,5 (en el último segundo). Todo correcto y rápido = 1000. */
export function scoreFor(parts, elapsedMs, answerMs) {
  const correct = parts.filter(Boolean).length
  if (!correct) return 0
  const t = Math.min(Math.max(elapsedMs, 0), answerMs) / answerMs
  return Math.round((MAX_POINTS * correct / parts.length) * (1 - t / 2))
}

/* Racha: preguntas SEGUIDAS enteras bien (las tres partes, o la alternativa
   correcta). Una parte mal (o no
   responder) la corta. Desde STREAK_MIN se luce con 🔥 junto al nombre. */
export const STREAK_MIN = 3

export function nextStreak(previous, parts) {
  return parts.every(Boolean) ? (previous || 0) + 1 : 0
}

/* Separa la wh-word del resto para pintarla con su color de rol. */
export function splitWh(prompt) {
  const m = prompt.match(/^(how (many|much|often|long|far|old)|what time|what kind of|\w+)\b/i)
  return m ? [m[0], prompt.slice(m[0].length)] : ['', prompt]
}
