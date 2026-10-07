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

/* Nombres que en inglés se usan para hombre Y para mujer. Con uno de ellos de
   sujeto, la pregunta no dice si va "he" o "she": un alumno vio "Sam", pensó en
   una mujer, eligió "She" y se le marcó mal. Pasa en clases de verdad, así que:
     · el banco base no los usa (lo vigila logic.test.js);
     · si aparecen en una actividad propia del docente, valen los dos pronombres.
   Andrea va porque en italiano es de hombre y en Chile de mujer. */
export const UNISEX_NAMES = new Set([
  'sam', 'alex', 'kim', 'chris', 'jordan', 'taylor', 'jamie', 'robin', 'casey', 'morgan',
  'charlie', 'pat', 'jesse', 'riley', 'drew', 'sasha', 'dani', 'frankie', 'jo', 'lee', 'andrea',
])

/* Sujetos válidos de una pregunta de Answer Builder, con el pronombre que falta
   cuando el sujeto es un nombre unisex. Lo usan la corrección, la solución que
   se proyecta, el resumen del celular y el reporte: todos dicen lo mismo. */
export function subjectAccept(q) {
  const accept = q.subject.accept
  const norm = accept.map(normalize)
  if (!norm.some((a) => UNISEX_NAMES.has(a))) return accept
  const extra = []
  if (norm.includes('he') && !norm.includes('she')) extra.push('She')
  if (norm.includes('she') && !norm.includes('he')) extra.push('He')
  return [...accept, ...extra]
}

export function shuffle(list, rand = Math.random) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* Orden de las preguntas del juego. Sin mezclar: null (el de la actividad).
   Mezcladas: los índices barajados, que el proyector sortea una vez al empezar
   y guarda en state.order, así recargar retoma el mismo orden. */
export function playOrder(count, mixed, rand = Math.random) {
  if (!mixed) return null
  return shuffle([...Array(count).keys()], rand)
}

/* Las preguntas en el orden en que se juegan. El historial de cada alumno, su
   resumen y el reporte van por posición: "Q3" es la tercera que se jugó. */
export function playedQuestions(questions, order) {
  const list = Array.isArray(order) ? order : order && typeof order === 'object' ? Object.values(order) : null
  if (!list || list.length !== questions.length) return questions
  return list.map((i) => questions[i])
}

/* 2X: el profesor puede hacer que la última pregunta valga el doble. Se activa
   en el ranking de antes, para que todos lo sepan antes de leerla. */
export const DOUBLE = 2

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
  /* Imagen en el celular: si es un enlace (las que vienen con la app, o https)
     viaja el enlace, que pesa nada, y cada celular la baja de la web. Si es una
     foto subida en el editor (data:, ~150 KB), solo el aviso: mandarla por
     Firebase a cada alumno gastaría la cuota gratuita en pocas clases. */
  const image = !q.image ? {} : q.image.startsWith('data:') ? { hasImage: true } : { hasImage: true, image: q.image }
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
  return { subject: subjectAccept(q), verb: q.verb.accept, wh: q.wh, example: q.example ?? null }
}

/* → partes acertadas como booleanos: [sujeto, verbo, wh] o [alternativa] */
export function checkAnswer(q, answer) {
  if (isChoice(q)) return [answer?.choice === q.answer]
  return [
    matches(subjectAccept(q), answer?.subject),
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

/* Resumen final de cada alumno. Por pregunta se guarda en su puntaje qué
   respondió, qué partes acertó y cuánto ganó. La clave lleva letra ("q3") para
   que Firebase no lo convierta en una lista con huecos. */
export const historyKey = (qIndex) => `q${qIndex}`

export function historyEntry(q, answer, parts, gain) {
  const given = !answer ? null
    : isChoice(q) ? { choice: answer.choice ?? '' }
    : { subject: answer.subject ?? '', verb: answer.verb ?? '', wh: answer.wh ?? '' }
  return { parts, gain, answer: given }
}

/* La pregunta tal como la ve el resumen: con su solución (el juego ya terminó)
   y sin la imagen, que pesa y no hace falta para repasar. */
export function reviewQuestion(q) {
  const { image, ...rest } = q
  // El resumen del celular muestra la solución: también con el pronombre extra.
  if (!isChoice(q) && q.subject) rest.subject = { ...q.subject, accept: subjectAccept(q) }
  return image ? { ...rest, hasImage: true } : rest
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
