/* ============================================================================
   ESPAÑOL E INGLÉS
   ----------------------------------------------------------------------------
   El idioma es de la SALA: lo elige el docente en el lobby y lo siguen el
   proyector (también sus controles), los celulares y el reporte. Una clase de
   inglés queda toda en inglés; una de otra asignatura, toda en español. Antes
   de entrar a una sala (portada, entrada) manda el idioma del navegador, con
   un selector. Es el mismo criterio que Liveboard.

   El idioma se guarda en rooms/{pin}/meta/lang: meta ya se puede escribir con
   las reglas actuales, así que no hubo que tocarlas.

   Las PREGUNTAS no se traducen: son contenido, y las de los cursos de inglés
   están en inglés a propósito. Se traduce todo lo que las rodea.

   Cada texto vive aquí con sus dos versiones, una al lado de la otra
   (i18n.test.js revisa que no falte ninguna). Los textos con datos son
   funciones.
   ========================================================================== */
import { createContext, useContext } from 'react'

export const IDIOMAS = ['es', 'en']

/* Sin idioma guardado (salas de antes, o primera vez): inglés, que es como se
   veía todo lo de los estudiantes hasta ahora. */
export const IDIOMA_POR_DEFECTO = 'en'

export const TEXTOS = {
  // ── General ───────────────────────────────────────────────────────────
  cargando: { es: 'Cargando…', en: 'Loading…' },
  conectando: { es: 'Conectando…', en: 'Connecting…' },
  lema: { es: 'Responde preguntas como un pro', en: 'Answer questions like a pro' },
  pinJuego: { es: 'PIN del juego', en: 'Game PIN' },
  entrar: { es: 'Entrar', en: 'Enter' },
  soyProfe: { es: 'Soy profesor/a · crear una sala', en: 'I’m a teacher · create a room' },
  pin: { es: 'PIN', en: 'PIN' },
  puntos: { es: (n) => `${n} puntos`, en: (n) => `${n} points` },

  // ── Roles del Answer Builder y tipos de información ────────────────────
  rol_subject: { es: 'Sujeto', en: 'Subject' },
  rol_verb: { es: 'Verbo', en: 'Verb' },
  rol_wh: { es: 'Información', en: 'Information' },
  pista_subject: { es: '¿De quién o de qué trata la respuesta?', en: 'Who or what is the answer about?' },
  pista_verb: { es: 'El verbo con su tiempo', en: 'The verb with its tense' },
  pista_wh: { es: '¿Qué tipo de información?', en: 'What kind of information?' },
  wh_place: { es: 'un lugar', en: 'a place' },
  wh_time: { es: 'un momento', en: 'a time' },
  wh_person: { es: 'una persona', en: 'a person' },
  wh_thing: { es: 'una cosa', en: 'a thing' },
  wh_action: { es: 'una acción', en: 'an action' },
  wh_reason: { es: 'una razón', en: 'a reason' },
  wh_manner: { es: 'una manera', en: 'a way / manner' },
  wh_quantity: { es: 'una cantidad', en: 'a quantity' },
  wh_frequency: { es: 'una frecuencia', en: 'a frequency' },
  wh_duration: { es: 'una duración', en: 'a duration' },

  // ── Equipos ───────────────────────────────────────────────────────────
  equipo_foxes: { es: 'Zorros', en: 'Foxes' },
  equipo_pandas: { es: 'Pandas', en: 'Pandas' },
  equipo_dolphins: { es: 'Delfines', en: 'Dolphins' },
  equipo_frogs: { es: 'Ranas', en: 'Frogs' },
  equipo_owls: { es: 'Búhos', en: 'Owls' },
  equipo_lions: { es: 'Leones', en: 'Lions' },
  equipo_octopuses: { es: 'Pulpos', en: 'Octopuses' },
  equipo_tigers: { es: 'Tigres', en: 'Tigers' },
  equipo_unicorns: { es: 'Unicornios', en: 'Unicorns' },
  equipo_penguins: { es: 'Pingüinos', en: 'Penguins' },

  // ── Celular · entrar ──────────────────────────────────────────────────
  teSacaron: { es: 'Te sacaron del juego.', en: 'You were removed from the game.' },
  juegoTermino: { es: 'El juego terminó.', en: 'The game has ended.' },
  pinSeisNumeros: { es: 'El PIN tiene 6 números.', en: 'The PIN has 6 numbers.' },
  escribeNombre: { es: 'Escribe tu nombre.', en: 'Write your name.' },
  juegoNoEncontrado: { es: 'No se encontró el juego. Revisa el PIN.', en: 'Game not found. Check the PIN.' },
  nombreOcupado: { es: 'Ese nombre ya está en uso. Prueba con otro.', en: 'That name is taken. Try another one.' },
  tuNombre: { es: 'Tu nombre', en: 'Your name' },
  entrando: { es: 'Entrando…', en: 'Joining…' },
  unirse: { es: 'Entrar', en: 'Join' },

  // ── Celular · en juego ────────────────────────────────────────────────
  estasDentro: { es: (n) => `¡Estás dentro, ${n}!`, en: (n) => `You're in, ${n}!` },
  miraPantallaEmpieza: { es: 'Mira la pantalla. El juego empieza pronto.', en: 'Look at the screen. The game starts soon.' },
  siguienteJuego: { es: '⏳ Siguiente juego', en: '⏳ Next game' },
  leeAtento: { es: 'Lee con atención', en: 'Read carefully' },
  respuestaEnviada: { es: '¡Respuesta enviada!', en: 'Answer sent!' },
  esperaOtros: { es: 'Espera a los demás…', en: 'Wait for the others…' },
  seAcaboTiempo: { es: '¡Se acabó el tiempo!', en: "Time's up!" },
  masRapido: { es: 'La próxima, más rápido.', en: 'Be faster next time.' },
  tuEquipoEs: { es: (n) => `Tu equipo va #${n}`, en: (n) => `Your team is #${n}` },
  ranking: { es: 'Ranking', en: 'Ranking' },
  puntosEquipo: { es: (eq, n) => `${eq}: ${n} puntos (promedio del equipo)`, en: (eq, n) => `${eq}: ${n} points (team average)` },
  tuPuntaje: { es: (n) => `Tú: ${n} puntos`, en: (n) => `You: ${n} points` },
  vasNumero: { es: (n) => `Vas #${n}`, en: (n) => `You are #${n}` },
  miraPantalla: { es: '¡Mira la pantalla!', en: 'Look at the screen!' },
  revelandoPodio: { es: 'Se está revelando el podio…', en: 'The podium is being revealed…' },
  secretoHastaPodio: { es: 'Secreto hasta el podio', en: 'Secret until the podium' },
  estasEnEquipo: { es: (n) => `¡Estás en ${n}!`, en: (n) => `You’re in the ${n}!` },
  conCompaneros: { es: (l) => `Con ${l}.`, en: (l) => `With ${l}.` },
  esperaCompaneros: { es: 'Espera a tus compañeros.', en: 'Wait for your teammates.' },
  profeArmaEquipos: { es: 'Tu profe está armando los equipos. Mira la pantalla.', en: 'The teacher is making the teams. Look at the screen.' },
  tuEquipo: { es: 'Tu equipo', en: 'Your team' },
  eligeEquipo: { es: 'Elige tu equipo', en: 'Choose your team' },
  lleno: { es: 'Lleno', en: 'Full' },
  puedesCambiar: { es: 'Todavía puedes cambiarte. Mira la pantalla.', en: 'You can still change. Look at the screen.' },
  tuEquipoSujeto: { es: 'Tu equipo', en: 'Your team' },
  tuSujeto: { es: 'Tú', en: 'You' },
  adelantoA: { es: (we, n) => `🔄 ¡${we} adelantó a ${n}!`, en: (we, n) => `🔄 ${we} overtook ${n}!` },
  adelantoATi: { es: (n, eq) => `😮 ¡${n} ${eq ? 'adelantó a tu equipo' : 'te adelantó'}!`, en: (n, eq) => `😮 ${n} overtook ${eq ? 'your team' : 'you'}!` },
  empate: { es: (we, r, eq) => `⚔️ ¡${eq ? 'Tu equipo está empatado' : 'Estás empatado'} con ${r}!`, en: (we, r, eq) => `⚔️ ${we} ${eq ? 'is' : 'are'} tied with ${r}!` },
  detras: { es: (we, g, r, eq) => `⚔️ ${eq ? 'Tu equipo está' : 'Estás'} a ${g} pts de ${r}. ¡Alcánzalo!`, en: (we, g, r, eq) => `⚔️ ${we} ${eq ? 'is' : 'are'} ${g} pts behind ${r}. Catch up!` },
  defiende: { es: (r, g, eq) => `⚔️ ${r} está a ${g} pts de ${eq ? 'tu equipo' : 'ti'}. ¡Defiende tu puesto!`, en: (r, g, eq) => `⚔️ ${r} is ${g} pts behind ${eq ? 'your team' : 'you'}. Defend your place!` },
  finDelJuego: { es: 'Fin del juego', en: 'Game over' },
  puntosEquipoFinal: { es: (n) => `${n} puntos (promedio del equipo).`, en: (n) => `${n} points (team average).` },
  campeones: { es: '¡Campeones! 👑', en: 'Champions! 👑' },
  bienEquipo: { es: '¡Bien hecho, equipo!', en: 'Well done, team!' },
  eresMvp: { es: '⭐ ¡Eres el MVP!', en: '⭐ You’re the MVP!' },
  posicionFinal: { es: (n) => `Posición final: #${n}`, en: (n) => `Final position: #${n}` },
  puntosFinal: { es: (n) => `${n} puntos.`, en: (n) => `${n} points.` },
  eresCampeon: { es: '¡Eres el campeón! 👑', en: 'You are the champion! 👑' },
  bienHecho: { es: '¡Bien hecho!', en: 'Well done!' },
  resultado: { es: '🏆 Resultado', en: '🏆 Result' },
  repasarRespuestas: { es: '📋 Repasar mis respuestas', en: '📋 Review my answers' },
  verRespuestas: { es: '📋 Ver tus respuestas', en: '📋 See your answers' },
  totalmenteCorrectas: { es: (p) => ` totalmente correctas · ${p} puntos`, en: (p) => ` fully correct · ${p} points` },
  teniaImagen: { es: '📷 Esta pregunta tenía una imagen en la pantalla.', en: '📷 This question had a picture on the screen.' },
  sinRespuesta: { es: 'Sin respuesta.', en: 'No answer.' },
  tu: { es: 'Tú', en: 'You' },
  correcta: { es: 'Correcta', en: 'Correct' },
  respuestaPosible: { es: 'Respuesta posible:', en: 'Possible answer:' },
  tocaAgrandar: { es: 'Toca para agrandar', en: 'Tap to enlarge' },
  zoomAyuda: { es: 'Toca la imagen para acercar o alejar', en: 'Tap the picture to zoom in or out' },
  cerrarImagen: { es: 'Volver a la pregunta', en: 'Back to the question' },
  miraImagen: { es: '👀 Mira la imagen en la pantalla', en: '👀 Look at the picture on the screen' },
  practicaSinPuntos: { es: 'Práctica · sin puntos', en: 'Practice · no points' },
  ejSujeto: { es: 'ej. He', en: 'e.g. He' },
  ejVerbo: { es: 'ej. played', en: 'e.g. played' },
  enviando: { es: 'Enviando…', en: 'Sending…' },
  enviarRespuesta: { es: 'Enviar respuesta', en: 'Send answer' },
  tuRespuesta: { es: 'Tu respuesta', en: 'Your answer' },
  respuestaCorrecta: { es: 'Respuesta correcta', en: 'Correct answer' },
  veredicto_right: { es: '¡Correcto!', en: 'Correct!' },
  veredicto_partial: { es: '¡Casi!', en: 'Almost!' },
  veredicto_wrong: { es: 'Incorrecto', en: 'Incorrect' },
  veredicto_none: { es: 'Sin respuesta', en: 'No answer' },
  puntosSecretos: { es: 'Los puntos son secretos hasta el podio 🤫', en: 'Points are secret until the podium 🤫' },
  practicaNoCuenta: { es: 'Práctica: estos puntos no cuentan.', en: 'Practice: these points don’t count.' },
  seguidas: { es: (n) => `🔥 ¡${n} seguidas!`, en: (n) => `🔥 ${n} in a row!` },
  seguidasTitulo: { es: (n) => `${n} correctas seguidas`, en: (n) => `${n} correct in a row` },
  partesBien: { es: (n) => `${n} de 3 partes bien`, en: (n) => `${n} of 3 parts right` },

  // ── Proyector · sala ──────────────────────────────────────────────────
  noSeCreo: { es: (m) => `No se pudo crear la sala: ${m}`, en: (m) => `The room could not be created: ${m}` },
  creandoSala: { es: 'Creando sala…', en: 'Creating room…' },
  confirmarCerrar: { es: '¿Cerrar la sala? Los alumnos quedarán fuera.', en: 'Close the room? Students will be left out.' },
  salaNoExiste: { es: 'Esta sala ya no existe.', en: 'This room no longer exists.' },
  crearOtraSala: { es: 'Crear otra sala', en: 'Create another room' },
  cargandoSala: { es: 'Cargando sala…', en: 'Loading room…' },
  conectados: { es: (n) => `${n} ${n === 1 ? 'conectado' : 'conectados'}`, en: (n) => `${n} connected` },
  practicaNoSuma: { es: 'PRÁCTICA · no suma puntos', en: 'PRACTICE · no points' },
  preguntaDe: { es: (i, n) => `Pregunta ${i} / ${n}`, en: (i, n) => `Question ${i} / ${n}` },
  modoLocal: { es: 'MODO LOCAL · solo pestañas de este navegador', en: 'LOCAL MODE · this browser’s tabs only' },
  cerrarSala: { es: 'Cerrar sala', en: 'Close room' },
  usarClaro: { es: 'Usar modo claro', en: 'Use light mode' },
  usarOscuro: { es: 'Usar modo oscuro', en: 'Use dark mode' },
  volverLobby: { es: '← Volver al lobby', en: '← Back to the lobby' },
  volverPodio: { es: '🏆 Volver al podio', en: '🏆 Back to the podium' },
  preguntaPractica: { es: 'Pregunta de práctica', en: 'Practice question' },
  leeLaPregunta: { es: 'Lee la pregunta…', en: 'Read the question…' },
  respondeCelular: { es: '¡Responde en tu celular!', en: 'Answer on your phone!' },
  respondieronDe: { es: (n) => ` / ${n} respondieron`, en: (n) => ` / ${n} answered` },
  saltarLectura: { es: 'Saltar lectura', en: 'Skip reading' },
  terminarTiempo: { es: 'Terminar tiempo', en: 'End time' },
  rankingEquipos: { es: 'Ranking de equipos', en: 'Team ranking' },
  notaEquipos: { es: 'Puntos del equipo = el promedio de sus integrantes', en: 'Team points = the average of its players' },

  // ── Proyector · lobby ─────────────────────────────────────────────────
  unirseJuego: { es: 'Únete al juego', en: 'Join the game' },
  qrUnirse: { es: 'Código QR para unirse', en: 'QR code to join' },
  idiomaSala: { es: 'Idioma de la sala', en: 'Room language' },
  idiomaAyuda: { es: 'Lo ven el proyector y los celulares.', en: 'Used on the projector and on phones.' },
  curso: { es: 'Curso', en: 'Course' },
  experiencia: { es: (b) => `Experiencia de aprendizaje · ${b}`, en: (b) => `Learning experience · ${b}` },
  actividad: { es: 'Actividad', en: 'Activity' },
  nPreguntas: { es: (n) => `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`, en: (n) => `${n} ${n === 1 ? 'question' : 'questions'}` },
  unContenido: { es: (n) => ` · un contenido, ${n} preguntas`, en: (n) => ` · one topic, ${n} questions` },
  editarActividad: { es: (n, mia) => `✏️ Editar “${n}”${mia ? ' (tu versión)' : ''}`, en: (n, mia) => `✏️ Edit “${n}”${mia ? ' (your version)' : ''}` },
  preguntaPracticaInicio: { es: 'Pregunta de práctica al inicio (no suma puntos)', en: 'Practice question at the start (no points)' },
  si: { es: 'Sí', en: 'Yes' },
  no: { es: 'No', en: 'No' },
  sujetoYVerbo: { es: 'Sujeto y verbo', en: 'Subject and verb' },
  elegirLista: { es: 'Elegir de una lista', en: 'Choose from a list' },
  escribirlos: { es: 'Escribirlos', en: 'Type them' },
  ordenPreguntas: { es: 'Orden de las preguntas', en: 'Question order' },
  enOrden: { es: 'En orden', en: 'In order' },
  mezcladas: { es: 'Mezcladas', en: 'Shuffled' },
  modoJuego: { es: 'Modo de juego', en: 'Game mode' },
  individual: { es: 'Individual', en: 'Individual' },
  equipos: { es: 'Equipos', en: 'Teams' },
  tiempoLectura: { es: 'Tiempo de lectura', en: 'Reading time' },
  tiempoResponder: { es: 'Tiempo para responder', en: 'Time to answer' },
  alumnosN: { es: (n) => `Alumnos (${n})`, en: (n) => `Students (${n})` },
  verEquiposAbajo: { es: 'Organízalos en el panel de equipos →', en: 'Arrange them in the teams panel →' },
  practicaCorto: { es: 'Pregunta de práctica', en: 'Practice question' },
  elegirCorto: { es: 'De una lista', en: 'From a list' },
  esperandoUnan: { es: 'Esperando que se unan…', en: 'Waiting for students to join…' },
  expulsar: { es: 'Expulsar', en: 'Remove' },
  cargandoActividad: { es: 'Cargando tu actividad…', en: 'Loading your activity…' },
  iniciaSesionActividad: { es: 'Inicia sesión para usar tu actividad, o elige otra.', en: 'Sign in to use your activity, or choose another one.' },
  verUltimoResumen: { es: '📊 Ver resumen del último juego', en: '📊 See the last game’s summary' },
  comenzar: { es: 'Comenzar ▶', en: 'Start ▶' },
  desc_answer_builder: { es: 'Arman la respuesta a una pregunta abierta: sujeto, verbo con su tiempo y tipo de dato que pide la WH.', en: 'Students build the answer to an open question: subject, verb with its tense, and the kind of information the WH word asks for.' },
  desc_exam_practice: { es: 'Repaso general de la EA estilo Kahoot: varios contenidos KC, 3–4 alternativas por pregunta.', en: 'General review of the learning experience, Kahoot style: several key contents, 3–4 options per question.' },
  desc_picture_practice: { es: 'Opción múltiple con una imagen por pregunta en el proyector. La pista del tiempo está en la oración.', en: 'Multiple choice with a picture per question on the projector. The clue is in the sentence.' },
  desc_grammar_focus: { es: 'Un solo contenido KC, con distintos formatos de pregunta. Corta: 6 preguntas.', en: 'A single key content, with different question formats. Short: 6 questions.' },

  // ── Proyector · equipos ───────────────────────────────────────────────
  equiposAlumnos: { es: (n) => `Equipos · ${n} alumnos`, en: (n) => `Teams · ${n} students` },
  alAzar: { es: 'Al azar', en: 'Random' },
  ellosEligen: { es: 'Ellos eligen', en: 'They choose' },
  nEquipos: { es: (n) => `${n} equipos`, en: (n) => `${n} teams` },
  repartirAzar: { es: '🎲 Repartir al azar', en: '🎲 Shuffle into teams' },
  ayudaElegir: { es: 'Cada alumno elige su equipo en el celular. ', en: 'Each student chooses their team on the phone. ' },
  ayudaAzar: { es: 'Toca “Repartir al azar” cuando estén todos. ', en: 'Tap “Shuffle into teams” when everyone is in. ' },
  ayudaEquipos: {
    es: (a, b) => `De ${a} a ${b} por equipo. Puedes mover a cualquiera con su menú, y quien quede sin equipo entra al más pequeño al comenzar.`,
    en: (a, b) => `${a} to ${b} per team. You can move anyone with their menu, and anyone without a team joins the smallest one at the start.`,
  },
  moverEquipo: { es: 'Mover a otro equipo', en: 'Move to another team' },
  nombreEquipo: { es: 'Nombre del equipo', en: 'Team name' },
  porEquipo: { es: (a, b) => `De ${a} a ${b} por equipo`, en: (a, b) => `${a} to ${b} per team` },
  sinEquipo: { es: (n) => `Sin equipo · ${n}`, en: (n) => `No team · ${n}` },

  // ── Proyector · mis actividades y edición ─────────────────────────────
  misActividades: { es: 'Mis actividades', en: 'My activities' },
  creadasPorTi: { es: ' · creadas por ti, solo tú las ves', en: ' · made by you, only you can see them' },
  opcionMultiple: { es: 'Opción múltiple', en: 'Multiple choice' },
  crearActividad: { es: (sesion) => `+ Crear actividad${sesion ? '' : ' (inicia sesión con Google)'}`, en: (sesion) => `+ Create activity${sesion ? '' : ' (sign in with Google)'}` },
  deQueTipo: { es: '¿De qué tipo?', en: 'What kind?' },
  opcionMultipleKahoot: { es: 'Opción múltiple (tipo Kahoot)', en: 'Multiple choice (Kahoot style)' },
  cancelar: { es: 'Cancelar', en: 'Cancel' },
  editandoVersion: { es: 'Editando tu versión de', en: 'Editing your version of' },
  cambiosSoloTuyos: { es: (n) => `Los cambios son solo tuyos (${n}); los demás docentes siguen viendo la original.`, en: (n) => `Changes are only yours (${n}); other teachers still see the original.` },
  restaurarOriginal: { es: 'Restaurar original', en: 'Restore original' },
  confirmarRestaurar: { es: '¿Volver a la versión original? Se perderán tus cambios en esta actividad.', en: 'Go back to the original version? Your changes to this activity will be lost.' },
  nuevaActividad: { es: 'Nueva actividad', en: 'New activity' },
  editandoActividad: { es: 'Editando tu actividad', en: 'Editing your activity' },
  soloTuLaVes: { es: 'Solo tú la ves y la puedes usar.', en: 'Only you can see and use it.' },
  eliminarActividad: { es: 'Eliminar actividad', en: 'Delete activity' },
  confirmarEliminar: { es: (n) => `¿Eliminar "${n}"? No se puede deshacer.`, en: (n) => `Delete "${n}"? This can’t be undone.` },
  tocaCerrar: { es: 'toca para cerrar', en: 'tap to close' },
  agrandarCodigo: { es: 'Agrandar el código para unirse', en: 'Enlarge the join code' },
  unirseCorto: { es: 'Únete', en: 'Join' },
  tuVersion: { es: '✏️ Tu versión', en: '✏️ Your version' },
  errPopupBloqueado: { es: 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio.', en: 'The browser blocked the Google window. Allow pop-ups for this site.' },
  errSinGoogle: { es: 'Falta activar el inicio de sesión con Google en la consola de Firebase.', en: 'Google sign-in is not enabled in the Firebase console.' },
  errDominio: { es: 'Falta autorizar este dominio en la consola de Firebase (Authentication → Settings).', en: 'This domain is not authorized in the Firebase console (Authentication → Settings).' },
  errSesion: { es: (m) => `No se pudo iniciar sesión: ${m}`, en: (m) => `Could not sign in: ${m}` },
  iniciarSesion: { es: 'Iniciar sesión con Google', en: 'Sign in with Google' },
  salir: { es: 'Salir', en: 'Sign out' },

  // ── Proyector · ranking, revelar y podio ──────────────────────────────
  duelo: { es: (g) => `⚔️ VS · ${g} pts`, en: (g) => `⚔️ VS · ${g} pts` },
  dueloFinal: { es: '⚔️ Duelo final · ¡última pregunta!', en: '⚔️ Final duel · last question!' },
  solo: { es: (g) => `a solo ${g} puntos`, en: (g) => `only ${g} points apart` },
  adelanto: { es: (a, b) => `🔄 ¡${a} adelantó a ${b}!`, en: (a, b) => `🔄 ${a} overtook ${b}!` },
  siguientePregunta: { es: 'Siguiente pregunta →', en: 'Next question →' },
  dobleActivar: { es: '⚡ Última pregunta 2X', en: '⚡ Last question 2X' },
  dobleQuitar: { es: '⚡ 2X activado · quitar', en: '⚡ 2X on · turn off' },
  dobleAviso: { es: '⚡ 2X · ¡esta pregunta vale doble!', en: '⚡ 2X · this question is worth double!' },
  dobleCorto: { es: '⚡ 2X', en: '⚡ 2X' },
  dobleProxima: { es: '⚡ 2X · ¡la última pregunta vale doble!', en: '⚡ 2X · the last question is worth double!' },
  activarSonido: { es: '🔈 Activar sonido', en: '🔈 Turn on sound' },
  activarSonidoCorto: { es: 'Activar sonido', en: 'Turn on sound' },
  silenciar: { es: 'Silenciar', en: 'Mute' },
  volumen: { es: 'Volumen', en: 'Volume' },
  pctCorrecto: { es: (p) => `${p}% correcto`, en: (p) => `${p}% correct` },
  nRespuestas: { es: (n) => `${n} ${n === 1 ? 'respuesta' : 'respuestas'}`, en: (n) => `${n} ${n === 1 ? 'answer' : 'answers'}` },
  completoRespuestas: { es: (n) => ` con la respuesta completa · ${n} ${n === 1 ? 'respuesta' : 'respuestas'}`, en: (n) => ` fully correct · ${n} ${n === 1 ? 'answer' : 'answers'}` },
  correctoRespuestas: { es: (n) => ` correcto · ${n} ${n === 1 ? 'respuesta' : 'respuestas'}`, en: (n) => ` correct · ${n} ${n === 1 ? 'answer' : 'answers'}` },
  aJugar: { es: '¡Ahora sí, a jugar! →', en: 'Now for real, let’s play! →' },
  verPodio: { es: 'Ver podio 🏆', en: 'See podium 🏆' },
  verRanking: { es: 'Ver ranking →', en: 'See ranking →' },
  alumnosEscriben: { es: '✍️ Los alumnos lo escriben', en: '✍️ Students write it' },
  puntosPractica: { es: 'Puntos de práctica: no cuentan. ¡El juego de verdad parte en 0!', en: 'Practice points — they don’t count. The real game starts at 0!' },
  ptsCorto: { es: 'pts', en: 'pts' },
  yNMas: { es: (n) => `+ ${n} más · ver resumen`, en: (n) => `+ ${n} more · see summary` },
  yElGanador: { es: 'Y el ganador es…', en: 'And the winner is…' },
  yElGanadorFiesta: { es: '🎉 Y el ganador es… 🎉', en: '🎉 And the winner is… 🎉' },
  resultadosFinales: { es: 'Resultados finales', en: 'Final results' },
  mvpMejor: { es: 'MVP · mejor jugador', en: 'MVP · best player' },
  resumenCurso: { es: '📊 Resumen del curso', en: '📊 Class summary' },
  jugarOtraVez: { es: 'Jugar otra vez', en: 'Play again' },

  // ── Editor de actividades ─────────────────────────────────────────────
  ponleTitulo: { es: 'Ponle un título a la actividad.', en: 'Give the activity a title.' },
  noSeGuardo: { es: (m) => `No se pudo guardar: ${m}`, en: (m) => `Could not save: ${m}` },
  tituloActividad: { es: 'Título de la actividad', en: 'Activity title' },
  preguntaHueco: { es: 'Pregunta (usa ___ para el hueco)', en: 'Question (use ___ for the gap)' },
  preguntaAbierta: { es: 'Pregunta abierta (Where did…?)', en: 'Open question (Where did…?)' },
  subir: { es: 'Subir', en: 'Move up' },
  bajar: { es: 'Bajar', en: 'Move down' },
  eliminarPregunta: { es: 'Eliminar pregunta', en: 'Delete question' },
  alternativaCorrecta: { es: 'Alternativa correcta', en: 'Correct option' },
  alternativaN: { es: (n) => `Alternativa ${n}`, en: (n) => `Option ${n}` },
  quitarAlternativa: { es: 'Quitar alternativa', en: 'Remove option' },
  agregarAlternativa: { es: '+ Agregar alternativa', en: '+ Add option' },
  marcaCorrectaAyuda: { es: (a, b) => `Marca con ● la correcta. De ${a} a ${b} alternativas.`, en: (a, b) => `Mark the correct one with ●. ${a} to ${b} options.` },
  tipoDato: { es: 'Tipo de dato que pide', en: 'Kind of information it asks for' },
  respuestaModelo: { es: 'Respuesta modelo', en: 'Model answer' },
  sujetoCorrecto: { es: 'Sujeto correcto (separa con comas)', en: 'Correct subject (separate with commas)' },
  trampasSujeto: { es: 'Trampas de sujeto', en: 'Subject traps' },
  verboCorrecto: { es: 'Verbo correcto (separa con comas)', en: 'Correct verb (separate with commas)' },
  trampasVerbo: { es: 'Trampas de verbo', en: 'Verb traps' },
  agregarPregunta: { es: (n, max) => `+ Agregar pregunta (${n} / ${max})`, en: (n, max) => `+ Add question (${n} / ${max})` },
  corrigeRojo: { es: 'Corrige las preguntas marcadas en rojo para guardar.', en: 'Fix the questions marked in red to save.' },
  preguntasListas: { es: (n) => `${n} preguntas listas.`, en: (n) => `${n} questions ready.` },
  guardando: { es: 'Guardando…', en: 'Saving…' },
  guardar: { es: 'Guardar', en: 'Save' },
  imagenMuyGrande: { es: 'La imagen es demasiado grande incluso comprimida. Prueba con otra más simple.', en: 'The image is too large even when compressed. Try a simpler one.' },
  pegaEnlace: { es: 'Pega el enlace de la imagen (https://…)', en: 'Paste the image link (https://…)' },
  imagenPregunta: { es: 'Imagen de la pregunta', en: 'Question image' },
  cambiarImagen: { es: 'Cambiar imagen', en: 'Change image' },
  quitarImagen: { es: 'Quitar imagen', en: 'Remove image' },
  procesando: { es: 'Procesando…', en: 'Processing…' },
  agregarImagen: { es: '🖼 Agregar imagen', en: '🖼 Add image' },
  pegarEnlace: { es: '🔗 Pegar enlace', en: '🔗 Paste link' },
  imagenOpcional: { es: 'Opcional · se ve en el proyector', en: 'Optional · shown on the projector' },

  // ── Reporte del curso ─────────────────────────────────────────────────
  reporteCurso: { es: '📊 Reporte del curso', en: '📊 Class report' },
  kpiCorrectas: { es: 'respuestas totalmente correctas', en: 'fully correct answers' },
  kpiParticipacion: { es: 'participación', en: 'participation' },
  kpiAlumnos: { es: 'alumnos', en: 'students' },
  kpiPreguntas: { es: 'preguntas', en: 'questions' },
  porParte: { es: '🧩 Answer Builder · por parte', en: '🧩 Answer Builder · by part' },
  parteDificil: { es: 'La parte más difícil:', en: 'Hardest part:' },
  pctBien: { es: (p) => ` (${p}% bien)`, en: (p) => ` (${p}% right)` },
  consejo_verb: { es: ' — el verbo lleva el tiempo: “did … work” → “worked”.', en: ' — the verb carries the tense: “did … work” → “worked”.' },
  consejo_subject: { es: ' — ojo: el sujeto de la respuesta, no el de la pregunta (“you” → “I”).', en: ' — remember: the answer’s subject, not the question’s (“you” → “I”).' },
  consejo_wh: { es: ' — ¿qué tipo de información pide la wh-word?', en: ' — what kind of information does the wh-word ask for?' },
  repasarJuntos: { es: '🔁 Repasar juntos', en: '🔁 Review together' },
  todosBien: { es: '¡Todos respondieron todo bien! 🎉', en: 'Everyone got everything right! 🎉' },
  destacados: { es: '🌟 Destacados', en: '🌟 Highlights' },
  destacadoMvp: { es: (n) => ` — MVP, ${n} puntos`, en: (n) => ` — MVP, ${n} points` },
  todoCorrecto: { es: '💯 Todo correcto: ', en: '💯 All correct: ' },
  rachaLarga: { es: '🔥 Racha más larga: ', en: '🔥 Longest streak: ' },
  enSeguidas: { es: (n) => `, ${n} seguidas`, en: (n) => `, ${n} in a row` },
  masMejoro: { es: '📈 El que más mejoró: ', en: '📈 Most improved: ' },
  segundaMitad: { es: (n) => ` (+${n}% en la segunda mitad)`, en: (n) => ` (+${n}% in the second half)` },
  juegaParaDestacados: { es: 'Juega una partida para ver los destacados.', en: 'Play a game to see highlights.' },
  preguntaPorPregunta: { es: '📋 Pregunta por pregunta', en: '📋 Question by question' },
  detalleAlumno: { es: '👁 Detalle por alumno', en: '👁 Per-student detail' },
  soloParaTi: { es: ' — solo para ti: evita proyectarlo', en: ' — only for you: avoid projecting it' },
  colAlumno: { es: 'Alumno', en: 'Student' },
  colPuntos: { es: 'Puntos', en: 'Points' },
  colCorrectas: { es: 'Correctas', en: 'Correct' },
  colRespondio: { es: 'Respondió', en: 'Answered' },
  colFallo: { es: 'Falló en', en: 'Missed' },
  descargarCsv: { es: '⬇ Descargar CSV (Excel)', en: '⬇ Download CSV (Excel)' },
  errorComun: { es: 'Error más común:', en: 'Most common mistake:' },
  parteMasFallada: { es: 'Parte más fallada:', en: 'Most missed part:' },
  noRespondieron: { es: (p) => `${p}% no respondió`, en: (p) => `${p}% didn’t answer` },
  csvAlumno: { es: 'Alumno', en: 'Student' },
  csvPuntos: { es: 'Puntos', en: 'Points' },
  csvCorrectas: { es: 'Totalmente correctas', en: 'Fully correct' },
  csvRespondio: { es: 'Respondió', en: 'Answered' },
  csvPregunta: { es: 'Pregunta', en: 'Question' },
  csvEnunciado: { es: 'Enunciado', en: 'Prompt' },
  csvRespuesta: { es: 'Respuesta correcta', en: 'Correct answer' },
  csvResultado: { es: 'Resultado del curso', en: 'Class result' },
}

const IdiomaCtx = createContext(IDIOMA_POR_DEFECTO)
export const ProveedorIdioma = IdiomaCtx.Provider

/** El idioma del navegador, para antes de entrar a una sala. */
export const idiomaDelNavegador = () =>
  (typeof navigator !== 'undefined' && /^es\b/i.test(navigator.language || '') ? 'es' : 'en')

export const valido = (l) => (IDIOMAS.includes(l) ? l : IDIOMA_POR_DEFECTO)

/** t('puntos', 3) → «3 points». Una clave que no existe se ve tal cual, para
    que se note en pantalla y no pase en silencio. */
export const traducir = (idioma, clave, ...args) => {
  const v = TEXTOS[clave]?.[valido(idioma)]
  if (v === undefined) return clave
  return typeof v === 'function' ? v(...args) : v
}

export function useT() {
  const idioma = useContext(IdiomaCtx)
  const t = (clave, ...args) => traducir(idioma, clave, ...args)
  t.idioma = idioma
  return t
}

/* El nombre de un equipo: el de la lista, traducido; si el profesor le puso
   otro, ese tal cual. */
export const nombreEquipo = (t, id, team) => {
  const clave = `equipo_${id}`
  const ingles = TEXTOS[clave]?.en
  return team?.name && team.name !== ingles ? team.name : t(clave)
}

/* El selector ES | EN. */
export function SelectorIdioma({ idioma, onCambiar, className = '' }) {
  return (
    <div role="group" aria-label="Idioma · Language" className={`inline-flex rounded-lg border border-slate-300 bg-white p-0.5 ${className}`}>
      {IDIOMAS.map((l) => (
        <button key={l} type="button" onClick={() => onCambiar(l)} aria-pressed={idioma === l}
          className={`px-2.5 py-1 rounded-md text-sm font-bold uppercase ${idioma === l ? 'bg-[#0F6FD6] text-white' : 'text-slate-600'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}
