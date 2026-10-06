import { mc } from './logic.js'
import { FOCUS } from './focus.js'
import { PICTURES } from './pictures.js'

/* Biblioteca de actividades: curso → EA (Experiencia de Aprendizaje) → set.

   Cada set es de un TIPO de actividad (su dinámica). Por ahora hay uno:
     answer-builder   Answer Builder: ante una pregunta abierta, el alumno arma el
                      esqueleto de la respuesta (sujeto, verbo con su tiempo y qué
                      clase de dato pide la wh-word).

   Cada EA practica la gramática CLAVE (KC) de su hoja de ruta: la que entra en
   la evaluación. Lo suplementario (SC) queda fuera a propósito, y por eso los
   intensivos no son la suma de sus dos cursos: ahí "can", "there is" o "have to"
   pasan a SC y se caen, y entran KC propias ("directions", "should", "past perfect").

   Cada pregunta:
     prompt      la pregunta tal como se proyecta
     subject     accept: sujetos válidos de la RESPUESTA (ojo: "you" → "I")
                 distractors: trampas típicas (la wh-word, el complemento, el pronombre equivocado)
     verb        accept: el verbo de la respuesta con su carga temporal
                 ("did … work" → "worked": el auxiliar se lleva el tiempo y al responder vuelve al verbo)
     wh          clave de WH_TYPES (logic.js): qué tipo de dato pide la pregunta
     example     una respuesta modelo posible, para mostrar al revelar */

/* ───────────── Básico · American English File Starter ───────────── */

const BASICO1_EA1 = [
  { prompt: 'Where is Tom from?', wh: 'place', example: 'He is from London.',
    subject: { accept: ['Tom', 'He'], distractors: ['Where', 'She', 'It'] },
    verb: { accept: ['is'], distractors: ['are', 'am', 'be'] } },
  { prompt: 'How old is your sister?', wh: 'quantity', example: 'She is twelve.',
    subject: { accept: ['My sister', 'She'], distractors: ['Your sister', 'He', 'Old'] },
    verb: { accept: ['is'], distractors: ['are', 'am', 'be'] } },
  { prompt: 'Where are Ana and Luis from?', wh: 'place', example: 'They are from Chile.',
    subject: { accept: ['Ana and Luis', 'They'], distractors: ['We', 'He', 'From'] },
    verb: { accept: ['are'], distractors: ['is', 'am', 'be'] } },
  { prompt: 'What is this?', wh: 'thing', example: 'It is a pen.',
    subject: { accept: ['It', 'This'], distractors: ['What', 'That', 'They'] },
    verb: { accept: ['is'], distractors: ['are', 'am', 'be'] } },
  { prompt: 'What are those?', wh: 'thing', example: 'They are keys.',
    subject: { accept: ['They', 'Those'], distractors: ['It', 'These', 'What'] },
    verb: { accept: ['are'], distractors: ['is', 'am', 'be'] } },
  { prompt: 'Who is that man?', wh: 'person', example: 'He is my teacher.',
    subject: { accept: ['That man', 'He'], distractors: ['She', 'Who', 'It'] },
    verb: { accept: ['is'], distractors: ['are', 'am', 'be'] } },
  { prompt: 'How old are you?', wh: 'quantity', example: 'I am nineteen.',
    subject: { accept: ['I'], distractors: ['You', 'We', 'He'] },
    verb: { accept: ['am'], distractors: ['are', 'is', 'be'] } },
  { prompt: 'Where are you from?', wh: 'place', example: 'I am from Mexico.',
    subject: { accept: ['I'], distractors: ['You', 'He', 'They'] },
    verb: { accept: ['am'], distractors: ['are', 'is', 'be'] } },
  { prompt: 'Who are Emma and Jack?', wh: 'person', example: 'They are my friends.',
    subject: { accept: ['Emma and Jack', 'They'], distractors: ['We', 'She', 'Who'] },
    verb: { accept: ['are'], distractors: ['is', 'am', 'be'] } },
  { prompt: 'How old are your parents?', wh: 'quantity', example: 'They are fifty.',
    subject: { accept: ['My parents', 'They'], distractors: ['Your parents', 'We', 'He'] },
    verb: { accept: ['are'], distractors: ['is', 'am', 'be'] } },
]

const BASICO1_EA2 = [
  { prompt: 'Where does your father work?', wh: 'place', example: 'He works in a hospital.',
    subject: { accept: ['My father', 'He'], distractors: ['Your father', 'She', 'It'] },
    verb: { accept: ['works'], distractors: ['work', 'does work', 'working'] } },
  { prompt: 'What time do you get up?', wh: 'time', example: 'I get up at seven o’clock.',
    subject: { accept: ['I'], distractors: ['You', 'He', 'It'] },
    verb: { accept: ['get up'], distractors: ['gets up', 'do get up', 'getting up'] } },
  { prompt: 'What do Tom and Kate eat for breakfast?', wh: 'thing', example: 'They eat eggs and toast.',
    subject: { accept: ['Tom and Kate', 'They'], distractors: ['We', 'Breakfast', 'She'] },
    verb: { accept: ['eat'], distractors: ['eats', 'do eat', 'eating'] } },
  { prompt: 'How often does Sara go to the gym?', wh: 'frequency', example: 'She usually goes to the gym on Mondays.',
    subject: { accept: ['Sara', 'She'], distractors: ['The gym', 'He', 'It'] },
    verb: { accept: ['goes'], distractors: ['go', 'does go', 'going'] } },
  { prompt: 'Who does Paul live with?', wh: 'person', example: 'He lives with his parents.',
    subject: { accept: ['Paul', 'He'], distractors: ['Who', 'She', 'They'] },
    verb: { accept: ['lives'], distractors: ['live', 'does live', 'living'] } },
  { prompt: 'What does your mother drink in the morning?', wh: 'thing', example: 'She drinks coffee.',
    subject: { accept: ['My mother', 'She'], distractors: ['Your mother', 'He', 'The morning'] },
    verb: { accept: ['drinks'], distractors: ['drink', 'does drink', 'drinking'] } },
  { prompt: 'When do your parents watch TV?', wh: 'time', example: 'They watch TV in the evening.',
    subject: { accept: ['My parents', 'They'], distractors: ['Your parents', 'We', 'TV'] },
    verb: { accept: ['watch'], distractors: ['watches', 'do watch', 'watching'] } },
  { prompt: 'How do you go to work?', wh: 'manner', example: 'I go to work by bus.',
    subject: { accept: ['I'], distractors: ['You', 'Work', 'He'] },
    verb: { accept: ['go'], distractors: ['goes', 'do go', 'going'] } },
  { prompt: 'What color is your car?', wh: 'thing', example: 'It is red.',
    subject: { accept: ['My car', 'It'], distractors: ['Your car', 'Color', 'They'] },
    verb: { accept: ['is'], distractors: ['are', 'does', 'be'] } },
  { prompt: 'How many children does your aunt have?', wh: 'quantity', example: 'She has three children.',
    subject: { accept: ['My aunt', 'She'], distractors: ['Your aunt', 'Children', 'They'] },
    verb: { accept: ['has'], distractors: ['have', 'does have', 'haves'] } },
]

const BASICO2_EA1 = [
  { prompt: 'What is Anna reading?', wh: 'thing', example: 'She is reading a magazine.',
    subject: { accept: ['Anna', 'She'], distractors: ['He', 'What', 'It'] },
    verb: { accept: ['is reading'], distractors: ['reads', 'is read', 'reading'] } },
  { prompt: 'Where are the children playing?', wh: 'place', example: 'They are playing in the park.',
    subject: { accept: ['The children', 'They'], distractors: ['He', 'We', 'Where'] },
    verb: { accept: ['are playing'], distractors: ['is playing', 'play', 'playing'] } },
  { prompt: 'What can Leo cook?', wh: 'thing', example: 'He can cook pasta.',
    subject: { accept: ['Leo', 'He'], distractors: ['She', 'What', 'It'] },
    verb: { accept: ['can cook'], distractors: ['cans cook', 'can cooks', 'can to cook'] } },
  { prompt: 'What do you love doing on weekends?', wh: 'action', example: 'I love dancing.',
    subject: { accept: ['I'], distractors: ['You', 'We', 'Weekends'] },
    verb: { accept: ['love'], distractors: ['loves', 'do love', 'loving'] } },
  { prompt: 'Why is Maria wearing a coat?', wh: 'reason', example: 'She is wearing a coat because it is cold.',
    subject: { accept: ['Maria', 'She'], distractors: ['He', 'A coat', 'It'] },
    verb: { accept: ['is wearing'], distractors: ['wears', 'is wear', 'wearing'] } },
  { prompt: 'Who is Tom talking to?', wh: 'person', example: 'He is talking to his boss.',
    subject: { accept: ['Tom', 'He'], distractors: ['Who', 'She', 'They'] },
    verb: { accept: ['is talking'], distractors: ['talks', 'is talk', 'talking'] } },
  { prompt: 'How often does Kate watch movies?', wh: 'frequency', example: 'She watches movies every Friday.',
    subject: { accept: ['Kate', 'She'], distractors: ['Movies', 'He', 'They'] },
    verb: { accept: ['watches'], distractors: ['watch', 'does watch', 'is watch'] } },
  { prompt: 'How is Tom traveling to work today?', wh: 'manner', example: 'He is traveling by bike.',
    subject: { accept: ['Tom', 'He'], distractors: ['Work', 'She', 'Today'] },
    verb: { accept: ['is traveling'], distractors: ['travels', 'is travel', 'traveling'] } },
  { prompt: 'What time does the movie start?', wh: 'time', example: 'It starts at eight o’clock.',
    subject: { accept: ['The movie', 'It'], distractors: ['He', 'They', 'Time'] },
    verb: { accept: ['starts'], distractors: ['start', 'does start', 'is start'] } },
  { prompt: 'What does Ben hate doing?', wh: 'action', example: 'He hates cleaning the house.',
    subject: { accept: ['Ben', 'He'], distractors: ['She', 'What', 'It'] },
    verb: { accept: ['hates'], distractors: ['hate', 'does hate', 'hating'] } },
]

const BASICO2_EA2 = [
  { prompt: 'Where were you last night?', wh: 'place', example: 'I was at home.',
    subject: { accept: ['I'], distractors: ['You', 'He', 'Last night'] },
    verb: { accept: ['was'], distractors: ['were', 'am', 'did be'] } },
  { prompt: 'How many bedrooms are there in the hotel?', wh: 'quantity', example: 'There are twenty bedrooms.',
    subject: { accept: ['There'], distractors: ['It', 'They', 'The hotel'] },
    verb: { accept: ['are'], distractors: ['is', 'be', 'has'] } },
  { prompt: 'What did Kate have for breakfast?', wh: 'thing', example: 'She had cereal and a coffee.',
    subject: { accept: ['Kate', 'She'], distractors: ['He', 'Breakfast', 'It'] },
    verb: { accept: ['had'], distractors: ['have', 'did have', 'haved'] } },
  { prompt: 'When did your parents get married?', wh: 'time', example: 'They got married in 1995.',
    subject: { accept: ['My parents', 'They'], distractors: ['Your parents', 'We', 'He'] },
    verb: { accept: ['got married'], distractors: ['get married', 'getted married', 'did get married'] } },
  { prompt: 'Why was Tom late?', wh: 'reason', example: 'He was late because he missed the bus.',
    subject: { accept: ['Tom', 'He'], distractors: ['She', 'Late', 'It'] },
    verb: { accept: ['was'], distractors: ['were', 'is', 'did be'] } },
  { prompt: 'Who did you go to the concert with?', wh: 'person', example: 'I went with my cousin.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'The concert', 'He'] },
    verb: { accept: ['went'], distractors: ['go', 'goed', 'did go'] } },
  { prompt: 'How did Ana travel to Mexico?', wh: 'manner', example: 'She traveled by plane.',
    subject: { accept: ['Ana', 'She'], distractors: ['Mexico', 'He', 'It'] },
    verb: { accept: ['traveled'], distractors: ['travel', 'travels', 'did travel'] } },
  { prompt: 'What time did the party finish?', wh: 'time', example: 'It finished at midnight.',
    subject: { accept: ['The party', 'It'], distractors: ['They', 'Time', 'He'] },
    verb: { accept: ['finished'], distractors: ['finish', 'finishes', 'did finish'] } },
  { prompt: 'How long did you live in Canada?', wh: 'duration', example: 'I lived there for two years.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Canada', 'They'] },
    verb: { accept: ['lived'], distractors: ['live', 'lives', 'did live'] } },
  { prompt: 'How often did you visit your grandparents?', wh: 'frequency', example: 'I visited them every Sunday.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Your grandparents', 'They'] },
    verb: { accept: ['visited'], distractors: ['visit', 'visits', 'did visit'] } },
]

/* ───────────── Elemental · American English File 1 ───────────── */

const ELEMENTAL1_EA1 = [
  { prompt: 'Where is Rosa from?', wh: 'place', example: 'She is from Colombia.',
    subject: { accept: ['Rosa', 'She'], distractors: ['He', 'Where', 'It'] },
    verb: { accept: ['is'], distractors: ['are', 'am', 'does'] } },
  { prompt: 'How old are your cousins?', wh: 'quantity', example: 'They are twenty-one.',
    subject: { accept: ['My cousins', 'They'], distractors: ['Your cousins', 'We', 'He'] },
    verb: { accept: ['are'], distractors: ['is', 'am', 'do'] } },
  { prompt: 'What does Mark teach?', wh: 'thing', example: 'He teaches English.',
    subject: { accept: ['Mark', 'He'], distractors: ['She', 'What', 'They'] },
    verb: { accept: ['teaches'], distractors: ['teach', 'does teach', 'teachs'] } },
  { prompt: 'What time do you finish work?', wh: 'time', example: 'I finish work at six o’clock.',
    subject: { accept: ['I'], distractors: ['You', 'Work', 'He'] },
    verb: { accept: ['finish'], distractors: ['finishes', 'do finish', 'finishing'] } },
  { prompt: 'How do your children go to school?', wh: 'manner', example: 'They go to school by bus.',
    subject: { accept: ['My children', 'They'], distractors: ['Your children', 'We', 'School'] },
    verb: { accept: ['go'], distractors: ['goes', 'do go', 'going'] } },
  { prompt: 'Why does Emma study at night?', wh: 'reason', example: 'She studies at night because she works in the day.',
    subject: { accept: ['Emma', 'She'], distractors: ['He', 'Night', 'It'] },
    verb: { accept: ['studies'], distractors: ['study', 'studys', 'does study'] } },
  { prompt: 'Who does Carlos work with?', wh: 'person', example: 'He works with his brother.',
    subject: { accept: ['Carlos', 'He'], distractors: ['Who', 'She', 'They'] },
    verb: { accept: ['works'], distractors: ['work', 'does work', 'working'] } },
  { prompt: 'How often do you cook dinner?', wh: 'frequency', example: 'I cook dinner every day.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Dinner', 'He'] },
    verb: { accept: ['cook'], distractors: ['cooks', 'do cook', 'cooking'] } },
  { prompt: 'What color are Lucy’s eyes?', wh: 'thing', example: 'They are green.',
    subject: { accept: ['Lucy’s eyes', 'Her eyes', 'They'], distractors: ['Lucy', 'She', 'It'] },
    verb: { accept: ['are'], distractors: ['is', 'am', 'do'] } },
  { prompt: 'How many languages does Paolo speak?', wh: 'quantity', example: 'He speaks three languages.',
    subject: { accept: ['Paolo', 'He'], distractors: ['Languages', 'She', 'They'] },
    verb: { accept: ['speaks'], distractors: ['speak', 'does speak', 'speaking'] } },
]

const ELEMENTAL1_EA2 = [
  { prompt: 'What is Julia wearing today?', wh: 'thing', example: 'She is wearing a blue dress.',
    subject: { accept: ['Julia', 'She'], distractors: ['He', 'Today', 'It'] },
    verb: { accept: ['is wearing'], distractors: ['wears', 'is wear', 'wearing'] } },
  { prompt: 'Where are your parents staying this week?', wh: 'place', example: 'They are staying in a hotel.',
    subject: { accept: ['My parents', 'They'], distractors: ['Your parents', 'We', 'He'] },
    verb: { accept: ['are staying'], distractors: ['stay', 'is staying', 'staying'] } },
  { prompt: 'How many hours does Tom sleep at night?', wh: 'quantity', example: 'He sleeps eight hours.',
    subject: { accept: ['Tom', 'He'], distractors: ['Hours', 'She', 'It'] },
    verb: { accept: ['sleeps'], distractors: ['sleep', 'does sleep', 'is sleep'] } },
  { prompt: 'How often does it rain in London?', wh: 'frequency', example: 'It usually rains in the fall.',
    subject: { accept: ['It'], distractors: ['London', 'They', 'She'] },
    verb: { accept: ['rains'], distractors: ['rain', 'does rain', 'raining'] } },
  { prompt: 'Why is David running?', wh: 'reason', example: 'He is running because he is late.',
    subject: { accept: ['David', 'He'], distractors: ['She', 'Why', 'It'] },
    verb: { accept: ['is running'], distractors: ['runs', 'is runing', 'running'] } },
  { prompt: 'What does Sofia like doing on Sundays?', wh: 'action', example: 'She likes going to the beach.',
    subject: { accept: ['Sofia', 'She'], distractors: ['He', 'Sundays', 'It'] },
    verb: { accept: ['likes'], distractors: ['like', 'does like', 'liking'] } },
  { prompt: 'Who are you waiting for?', wh: 'person', example: 'I am waiting for my brother.',
    subject: { accept: ['I'], distractors: ['You', 'Who', 'We'] },
    verb: { accept: ['am waiting'], distractors: ['are waiting', 'wait', 'waiting'] } },
  { prompt: 'How long does your English class last?', wh: 'duration', example: 'It lasts two hours.',
    subject: { accept: ['My English class', 'It'], distractors: ['Your English class', 'They', 'I'] },
    verb: { accept: ['lasts'], distractors: ['last', 'does last', 'is lasting'] } },
  { prompt: 'How is Ana feeling today?', wh: 'manner', example: 'She is feeling tired.',
    subject: { accept: ['Ana', 'She'], distractors: ['He', 'Today', 'It'] },
    verb: { accept: ['is feeling'], distractors: ['feels', 'is feel', 'feeling'] } },
  { prompt: 'What time does the store open on Saturdays?', wh: 'time', example: 'It opens at nine o’clock.',
    subject: { accept: ['The store', 'It'], distractors: ['They', 'Saturdays', 'He'] },
    verb: { accept: ['opens'], distractors: ['open', 'does open', 'is open'] } },
]

const ELEMENTAL2_EA1 = [
  { prompt: 'Where was Frida Kahlo born?', wh: 'place', example: 'She was born in Mexico City.',
    subject: { accept: ['Frida Kahlo', 'She'], distractors: ['He', 'Where', 'It'] },
    verb: { accept: ['was born'], distractors: ['is born', 'were born', 'born'] } },
  { prompt: 'When did Neil Armstrong walk on the moon?', wh: 'time', example: 'He walked on the moon in 1969.',
    subject: { accept: ['Neil Armstrong', 'He'], distractors: ['The moon', 'She', 'It'] },
    verb: { accept: ['walked'], distractors: ['walk', 'walks', 'did walk'] } },
  { prompt: 'What did you buy at the market?', wh: 'thing', example: 'I bought some apples and cheese.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'The market', 'He'] },
    verb: { accept: ['bought'], distractors: ['buy', 'buyed', 'did buy'] } },
  { prompt: 'How much milk is there in the fridge?', wh: 'quantity', example: 'There is a little milk.',
    subject: { accept: ['There'], distractors: ['It', 'Milk', 'They'] },
    verb: { accept: ['is'], distractors: ['are', 'be', 'has'] } },
  { prompt: 'How many rooms were there in your old house?', wh: 'quantity', example: 'There were five rooms.',
    subject: { accept: ['There'], distractors: ['It', 'They', 'Rooms'] },
    verb: { accept: ['were'], distractors: ['was', 'are', 'did be'] } },
  { prompt: 'Why did Marco go to the doctor?', wh: 'reason', example: 'He went to the doctor because he felt sick.',
    subject: { accept: ['Marco', 'He'], distractors: ['The doctor', 'She', 'It'] },
    verb: { accept: ['went'], distractors: ['go', 'goed', 'did go'] } },
  { prompt: 'Who did Laura meet at the airport?', wh: 'person', example: 'She met her cousin.',
    subject: { accept: ['Laura', 'She'], distractors: ['The airport', 'He', 'Who'] },
    verb: { accept: ['met'], distractors: ['meet', 'meeted', 'did meet'] } },
  { prompt: 'How did they get to the beach?', wh: 'manner', example: 'They got there by car.',
    subject: { accept: ['They'], distractors: ['Them', 'The beach', 'We'] },
    verb: { accept: ['got'], distractors: ['get', 'getted', 'did get'] } },
  { prompt: 'Why is the train better than the bus?', wh: 'reason', example: 'It is faster and more comfortable.',
    subject: { accept: ['The train', 'It'], distractors: ['The bus', 'They', 'Better'] },
    verb: { accept: ['is'], distractors: ['are', 'was', 'does'] } },
  { prompt: 'How long did the storm last?', wh: 'duration', example: 'It lasted three hours.',
    subject: { accept: ['The storm', 'It'], distractors: ['They', 'He', 'Long'] },
    verb: { accept: ['lasted'], distractors: ['last', 'lasts', 'did last'] } },
]

const ELEMENTAL2_EA2 = [
  { prompt: 'Where are you going to stay in Rome?', wh: 'place', example: 'I am going to stay in a small hotel.',
    subject: { accept: ['I'], distractors: ['You', 'Rome', 'We'] },
    verb: { accept: ['am going to stay'], distractors: ['are going to stay', 'going to stay', 'am going stay'] } },
  { prompt: 'When is your sister going to start college?', wh: 'time', example: 'She is going to start in March.',
    subject: { accept: ['My sister', 'She'], distractors: ['Your sister', 'College', 'He'] },
    verb: { accept: ['is going to start'], distractors: ['are going to start', 'is going to starts', 'going to start'] } },
  { prompt: 'What is Tom going to cook tonight?', wh: 'thing', example: 'He is going to cook chicken.',
    subject: { accept: ['Tom', 'He'], distractors: ['She', 'Tonight', 'It'] },
    verb: { accept: ['is going to cook'], distractors: ['is going cook', 'are going to cook', 'going to cook'] } },
  { prompt: 'How does Ana drive?', wh: 'manner', example: 'She drives very carefully.',
    subject: { accept: ['Ana', 'She'], distractors: ['He', 'How', 'It'] },
    verb: { accept: ['drives'], distractors: ['drive', 'does drive', 'driving'] } },
  { prompt: 'Why do your friends want to learn Japanese?', wh: 'reason', example: 'They want to learn Japanese because they want to work in Tokyo.',
    subject: { accept: ['My friends', 'They'], distractors: ['Your friends', 'Japanese', 'We'] },
    verb: { accept: ['want to learn'], distractors: ['wants to learn', 'want learn', 'want learning'] } },
  { prompt: 'Who has your brother invited to the party?', wh: 'person', example: 'He has invited all his friends.',
    subject: { accept: ['My brother', 'He'], distractors: ['Your brother', 'The party', 'She'] },
    verb: { accept: ['has invited'], distractors: ['have invited', 'has invite', 'is invited'] } },
  { prompt: 'How many countries have you visited?', wh: 'quantity', example: 'I have visited six countries.',
    subject: { accept: ['I'], distractors: ['You', 'Countries', 'They'] },
    verb: { accept: ['have visited'], distractors: ['has visited', 'have visit', 'have visiting'] } },
  { prompt: 'How long did Paul stay in Peru?', wh: 'duration', example: 'He stayed there for two weeks.',
    subject: { accept: ['Paul', 'He'], distractors: ['Peru', 'She', 'It'] },
    verb: { accept: ['stayed'], distractors: ['stay', 'has stay', 'did stay'] } },
  { prompt: 'What has Lucy lost?', wh: 'thing', example: 'She has lost her phone.',
    subject: { accept: ['Lucy', 'She'], distractors: ['He', 'What', 'It'] },
    verb: { accept: ['has lost'], distractors: ['have lost', 'has losed', 'has lose'] } },
  { prompt: 'When did you last see a movie?', wh: 'time', example: 'I saw a movie last Friday.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'A movie', 'He'] },
    verb: { accept: ['saw'], distractors: ['see', 'seen', 'did see'] } },
]

/* ───────────── Intermedio · American English File 2 ───────────── */

const INTERMEDIO1_EA1 = [
  { prompt: 'Where did you go on vacation last summer?', wh: 'place', example: 'I went to Cancún.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Vacation', 'He'] },
    verb: { accept: ['went'], distractors: ['go', 'goed', 'did go'] } },
  { prompt: 'Why does Emily wear glasses?', wh: 'reason', example: 'She wears glasses because she can’t see well.',
    subject: { accept: ['Emily', 'She'], distractors: ['Glasses', 'He', 'They'] },
    verb: { accept: ['wears'], distractors: ['wear', 'does wear', 'is wear'] } },
  { prompt: 'Who are you meeting on Friday?', wh: 'person', example: 'I am meeting my old classmates.',
    subject: { accept: ['I'], distractors: ['You', 'Who', 'Friday'] },
    verb: { accept: ['am meeting'], distractors: ['are meeting', 'meet', 'meeting'] } },
  { prompt: 'When are Tom and Lisa flying to Cancún?', wh: 'time', example: 'They are flying next Monday.',
    subject: { accept: ['Tom and Lisa', 'They'], distractors: ['We', 'Cancún', 'She'] },
    verb: { accept: ['are flying'], distractors: ['is flying', 'fly', 'flying'] } },
  { prompt: 'How long did you stay at the hotel?', wh: 'duration', example: 'I stayed there for five nights.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'The hotel', 'It'] },
    verb: { accept: ['stayed'], distractors: ['stay', 'did stay', 'was stay'] } },
  { prompt: 'What is Carmen going to wear to the party?', wh: 'thing', example: 'She is going to wear a black dress.',
    subject: { accept: ['Carmen', 'She'], distractors: ['The party', 'He', 'It'] },
    verb: { accept: ['is going to wear'], distractors: ['is going to wearing', 'are going to wear', 'going to wear'] } },
  { prompt: 'How often does your brother argue with his boss?', wh: 'frequency', example: 'He argues with him almost every day.',
    subject: { accept: ['My brother', 'He'], distractors: ['Your brother', 'His boss', 'She'] },
    verb: { accept: ['argues'], distractors: ['argue', 'does argue', 'arguing'] } },
  { prompt: 'How does Mark usually dress for work?', wh: 'manner', example: 'He usually dresses very casually.',
    subject: { accept: ['Mark', 'He'], distractors: ['Work', 'She', 'It'] },
    verb: { accept: ['dresses'], distractors: ['dress', 'does dress', 'is dress'] } },
  { prompt: 'How many suitcases did Maria take?', wh: 'quantity', example: 'She took two suitcases.',
    subject: { accept: ['Maria', 'She'], distractors: ['Suitcases', 'He', 'They'] },
    verb: { accept: ['took'], distractors: ['take', 'taked', 'did take'] } },
  { prompt: 'Who does Ana usually sit next to in class?', wh: 'person', example: 'She usually sits next to Pedro.',
    subject: { accept: ['Ana', 'She'], distractors: ['Who', 'He', 'Class'] },
    verb: { accept: ['sits'], distractors: ['sit', 'does sit', 'is sit'] } },
]

const INTERMEDIO1_EA2 = [
  { prompt: 'What have you already bought for the party?', wh: 'thing', example: 'I have already bought the drinks.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'The party', 'He'] },
    verb: { accept: ['have bought'], distractors: ['has bought', 'have buyed', 'have buy'] } },
  { prompt: 'When did you buy your laptop?', wh: 'time', example: 'I bought it last year.',
    subject: { accept: ['I'], distractors: ['You', 'Your laptop', 'It'] },
    verb: { accept: ['bought'], distractors: ['have bought', 'buy', 'buyed'] } },
  { prompt: 'Why was Kevin bored at the museum?', wh: 'reason', example: 'He was bored because the tour was very long.',
    subject: { accept: ['Kevin', 'He'], distractors: ['The museum', 'She', 'It'] },
    verb: { accept: ['was'], distractors: ['were', 'is', 'did be'] } },
  { prompt: 'Where have you been this morning?', wh: 'place', example: 'I have been at the gym.',
    subject: { accept: ['I'], distractors: ['You', 'This morning', 'He'] },
    verb: { accept: ['have been'], distractors: ['has been', 'have be', 'was been'] } },
  { prompt: 'Who will you invite to your wedding?', wh: 'person', example: 'I will invite my family and close friends.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Who', 'Your wedding'] },
    verb: { accept: ['will invite'], distractors: ['will invites', 'will to invite', 'invite'] } },
  { prompt: 'How will people travel in 2050?', wh: 'manner', example: 'They will travel in electric cars.',
    subject: { accept: ['People', 'They'], distractors: ['We', 'He', 'It'] },
    verb: { accept: ['will travel'], distractors: ['will traveling', 'will to travel', 'travel'] } },
  { prompt: 'How many times has Rosa been to Europe?', wh: 'quantity', example: 'She has been to Europe three times.',
    subject: { accept: ['Rosa', 'She'], distractors: ['Europe', 'He', 'They'] },
    verb: { accept: ['has been'], distractors: ['have been', 'has be', 'is been'] } },
  { prompt: 'How long will the trip take?', wh: 'duration', example: 'It will take about four hours.',
    subject: { accept: ['The trip', 'It'], distractors: ['They', 'We', 'Long'] },
    verb: { accept: ['will take'], distractors: ['will takes', 'will took', 'takes'] } },
  { prompt: 'How often do you shop online?', wh: 'frequency', example: 'I shop online once a month.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Online', 'They'] },
    verb: { accept: ['shop'], distractors: ['shops', 'do shop', 'shopping'] } },
  { prompt: 'What has Tom ordered online?', wh: 'thing', example: 'He has ordered a new pair of sneakers.',
    subject: { accept: ['Tom', 'He'], distractors: ['She', 'What', 'It'] },
    verb: { accept: ['has ordered'], distractors: ['have ordered', 'has order', 'is ordered'] } },
]

const INTERMEDIO2_EA1 = [
  { prompt: 'Why do you have to wear a uniform at work?', wh: 'reason', example: 'I have to wear a uniform because I work in a hospital.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'A uniform', 'He'] },
    verb: { accept: ['have to wear'], distractors: ['has to wear', 'must to wear', 'have wear'] } },
  { prompt: 'Where would you live if you were rich?', wh: 'place', example: 'I would live near the ocean.',
    subject: { accept: ['I'], distractors: ['You', 'Rich', 'We'] },
    verb: { accept: ['would live'], distractors: ['will live', 'would lived', 'lived'] } },
  { prompt: 'How long have you known your best friend?', wh: 'duration', example: 'I have known her for ten years.',
    subject: { accept: ['I'], distractors: ['You', 'Your best friend', 'She'] },
    verb: { accept: ['have known'], distractors: ['has known', 'have knew', 'know'] } },
  { prompt: 'What will you buy if you get a bonus?', wh: 'thing', example: 'I will buy a new laptop.',
    subject: { accept: ['I'], distractors: ['You', 'A bonus', 'It'] },
    verb: { accept: ['will buy'], distractors: ['would buy', 'will bought', 'buy'] } },
  { prompt: 'When did Marie Curie win the Nobel Prize?', wh: 'time', example: 'She won it in 1903.',
    subject: { accept: ['Marie Curie', 'She'], distractors: ['The Nobel Prize', 'He', 'It'] },
    verb: { accept: ['won'], distractors: ['win', 'has won', 'winned'] } },
  { prompt: 'How does your boss speak to customers?', wh: 'manner', example: 'She speaks to them very politely.',
    subject: { accept: ['My boss', 'He', 'She'], distractors: ['Your boss', 'Customers', 'They'] },
    verb: { accept: ['speaks'], distractors: ['speak', 'does speak', 'speaking'] } },
  { prompt: 'Who did you decide to invite?', wh: 'person', example: 'I decided to invite my neighbors.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Who', 'They'] },
    verb: { accept: ['decided to invite'], distractors: ['decide to invite', 'decided inviting', 'decided invite'] } },
  { prompt: 'What do you enjoy doing after work?', wh: 'action', example: 'I enjoy going for a run.',
    subject: { accept: ['I'], distractors: ['You', 'Work', 'We'] },
    verb: { accept: ['enjoy'], distractors: ['enjoys', 'do enjoy', 'enjoy to'] } },
  { prompt: 'How many hours does Sara have to study?', wh: 'quantity', example: 'She has to study four hours a day.',
    subject: { accept: ['Sara', 'She'], distractors: ['Hours', 'He', 'They'] },
    verb: { accept: ['has to study'], distractors: ['have to study', 'has study', 'must to study'] } },
  { prompt: 'How often do you go swimming?', wh: 'frequency', example: 'I go swimming twice a week.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Swimming', 'He'] },
    verb: { accept: ['go'], distractors: ['goes', 'do go', 'going'] } },
]

const INTERMEDIO2_EA2 = [
  { prompt: 'Where did the ball go?', wh: 'place', example: 'It went over the wall.',
    subject: { accept: ['The ball', 'It'], distractors: ['They', 'He', 'Where'] },
    verb: { accept: ['went'], distractors: ['go', 'goed', 'did go'] } },
  { prompt: 'What time does Lisa wake up on Sundays?', wh: 'time', example: 'She wakes up at ten o’clock.',
    subject: { accept: ['Lisa', 'She'], distractors: ['Sundays', 'He', 'It'] },
    verb: { accept: ['wakes up'], distractors: ['wake up', 'does wake up', 'wakes'] } },
  { prompt: 'Where did you use to live when you were a child?', wh: 'place', example: 'I used to live in a small town.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'A child', 'He'] },
    verb: { accept: ['used to live'], distractors: ['use to live', 'used to lived', 'used live'] } },
  { prompt: 'What sport did you use to play at school?', wh: 'thing', example: 'I used to play volleyball.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'School', 'He'] },
    verb: { accept: ['used to play'], distractors: ['use to play', 'used to played', 'used play'] } },
  { prompt: 'Why might Tom be late?', wh: 'reason', example: 'He might be late because of the traffic.',
    subject: { accept: ['Tom', 'He'], distractors: ['She', 'Late', 'It'] },
    verb: { accept: ['might be'], distractors: ['might is', 'mights be', 'might to be'] } },
  { prompt: 'How did Ana get over her cold?', wh: 'manner', example: 'She got over it by resting and drinking tea.',
    subject: { accept: ['Ana', 'She'], distractors: ['Her cold', 'He', 'It'] },
    verb: { accept: ['got over'], distractors: ['get over', 'getted over', 'did get over'] } },
  { prompt: 'When did you take up yoga?', wh: 'time', example: 'I took up yoga two years ago.',
    subject: { accept: ['I'], distractors: ['You', 'Yoga', 'He'] },
    verb: { accept: ['took up'], distractors: ['take up', 'taked up', 'did take up'] } },
  { prompt: 'Who did you use to sit next to at school?', wh: 'person', example: 'I used to sit next to my best friend.',
    subject: { accept: ['I'], distractors: ['You', 'Who', 'School'] },
    verb: { accept: ['used to sit'], distractors: ['use to sit', 'used to sat', 'used sit'] } },
  { prompt: 'How many subjects did you use to study?', wh: 'quantity', example: 'I used to study eleven subjects.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'Subjects', 'They'] },
    verb: { accept: ['used to study'], distractors: ['use to study', 'used to studied', 'used study'] } },
  { prompt: 'How often did you use to go to the beach?', wh: 'frequency', example: 'We used to go every summer.',
    subject: { accept: ['I', 'We'], distractors: ['You', 'The beach', 'They'] },
    verb: { accept: ['used to go'], distractors: ['use to go', 'used to went', 'used go'] } },
]

/* ───────────── Intensivos: 12 preguntas de sus dos cursos + KC propias ───────────── */

/* Toma preguntas por su texto (o, en opción múltiple, por su respuesta correcta,
   porque "Choose the correct sentence." se repite). Si alguien edita una y ya
   no coincide, o coincide con dos, falla al cargar en vez de que el intensivo
   quede corto o con la pregunta equivocada. */
function pick(from, keys) {
  return keys.map((k) => {
    const found = from.filter((x) => x.prompt === k || x.answer === k)
    if (found.length !== 1) throw new Error(`sets.js: "${k}" coincide con ${found.length} preguntas`)
    return found[0]
  })
}

const BASICO_INT_EA1 = pick([...BASICO1_EA1, ...BASICO1_EA2], [
  'Where is Tom from?', 'How old is your sister?', 'What are those?', 'Who are Emma and Jack?',
  'Where does your father work?', 'What time do you get up?', 'What do Tom and Kate eat for breakfast?',
  'How often does Sara go to the gym?', 'Who does Paul live with?', 'How do you go to work?',
  'What color is your car?', 'How many children does your aunt have?',
])

const BASICO_INT_EA2 = [
  // "can / can't" es SC en el intensivo: fuera "What can Leo cook?"
  ...pick([...BASICO2_EA1, ...BASICO2_EA2], [
    'What is Anna reading?', 'Where are the children playing?', 'What do you love doing on weekends?',
    'Why is Maria wearing a coat?', 'How often does Kate watch movies?', 'How many bedrooms are there in the hotel?',
    'What did Kate have for breakfast?', 'When did your parents get married?', 'Who did you go to the concert with?',
    'How did Ana travel to Mexico?', 'How long did you live in Canada?',
  ]),
  // KC propia del intensivo: Practical English "Giving directions"
  { prompt: 'Where is the pharmacy?', wh: 'place', example: 'It is across from the bank.',
    subject: { accept: ['The pharmacy', 'It'], distractors: ['The bank', 'They', 'Where'] },
    verb: { accept: ['is'], distractors: ['are', 'does', 'be'] } },
]

const ELEMENTAL_INT_EA1 = pick([...ELEMENTAL1_EA1, ...ELEMENTAL1_EA2], [
  'Where is Rosa from?', 'What does Mark teach?', 'How do your children go to school?',
  'Why does Emma study at night?', 'How often do you cook dinner?', 'How many languages does Paolo speak?',
  'What is Julia wearing today?', 'Where are your parents staying this week?', 'Why is David running?',
  'What does Sofia like doing on Sundays?', 'Who are you waiting for?', 'What time does the store open on Saturdays?',
])

/* "there is / there was" y "verbs + infinitive" son SC en el intensivo. */
const ELEMENTAL_INT_EA2 = pick([...ELEMENTAL2_EA1, ...ELEMENTAL2_EA2], [
  'Where was Frida Kahlo born?', 'When did Neil Armstrong walk on the moon?', 'What did you buy at the market?',
  'Who did Laura meet at the airport?', 'How did they get to the beach?', 'Why is the train better than the bus?',
  'Where are you going to stay in Rome?', 'What is Tom going to cook tonight?', 'How does Ana drive?',
  'Who has your brother invited to the party?', 'How many countries have you visited?', 'How long did Paul stay in Peru?',
])

const INTERMEDIO_INT_EA1 = pick([...INTERMEDIO1_EA1, ...INTERMEDIO1_EA2], [
  'Where did you go on vacation last summer?', 'Who are you meeting on Friday?', 'When are Tom and Lisa flying to Cancún?',
  'What is Carmen going to wear to the party?', 'How often does your brother argue with his boss?',
  'How many suitcases did Maria take?', 'What have you already bought for the party?', 'Why was Kevin bored at the museum?',
  'Where have you been this morning?', 'How will people travel in 2050?', 'How many times has Rosa been to Europe?',
  'How long will the trip take?',
])

const INTERMEDIO_INT_EA2 = [
  // "have to / must" es SC en el intensivo; "should" y "past perfect" pasan a KC.
  ...pick([...INTERMEDIO2_EA1, ...INTERMEDIO2_EA2], [
    'Where would you live if you were rich?', 'How long have you known your best friend?',
    'What will you buy if you get a bonus?', 'When did Marie Curie win the Nobel Prize?',
    'How does your boss speak to customers?', 'What do you enjoy doing after work?',
    'Where did you use to live when you were a child?', 'Why might Tom be late?', 'When did you take up yoga?',
    'How often did you use to go to the beach?',
  ]),
  { prompt: 'Where should we have dinner tonight?', wh: 'place', example: 'We should go to the new Italian restaurant.',
    subject: { accept: ['We', 'You'], distractors: ['I', 'Dinner', 'They'] },
    verb: { accept: ['should go', 'should have'], distractors: ['should to go', 'should goes', 'shoulds go'] } },
  { prompt: 'What had Tom forgotten when he got to the airport?', wh: 'thing', example: 'He had forgotten his passport.',
    subject: { accept: ['Tom', 'He'], distractors: ['The airport', 'She', 'It'] },
    verb: { accept: ['had forgotten'], distractors: ['has forgotten', 'had forgot', 'had forgetted'] } },
]

/* ───────────── Preguntas de práctica ─────────────
   Una por EA, fácil y con la gramática de esa EA: va antes del juego como
   simulacro (no suma puntos) para que el curso entienda la dinámica. Los
   intensivos usan la de sus cursos regulares. */

const practice = (prompt, wh, example, subject, verb) => ({
  prompt, wh, example,
  subject: { accept: subject[0], distractors: subject[1] },
  verb: { accept: verb[0], distractors: verb[1] },
})

const PRACTICE = {
  basico1: [
    practice('Where is Maria from?', 'place', 'She is from Brazil.',
      [['Maria', 'She'], ['He', 'Where', 'They']], [['is'], ['are', 'am', 'be']]),
    practice('Where does Ben live?', 'place', 'He lives in Chicago.',
      [['Ben', 'He'], ['She', 'Where', 'They']], [['lives'], ['live', 'does live', 'living']]),
  ],
  basico2: [
    practice('What is Lucy eating?', 'thing', 'She is eating a sandwich.',
      [['Lucy', 'She'], ['He', 'What', 'It']], [['is eating'], ['eats', 'is eat', 'eating']]),
    practice('Where did Mike go yesterday?', 'place', 'He went to the park.',
      [['Mike', 'He'], ['She', 'Yesterday', 'It']], [['went'], ['go', 'goed', 'did go']]),
  ],
  elemental1: [
    practice('Where does Paul work?', 'place', 'He works in a bank.',
      [['Paul', 'He'], ['She', 'Where', 'It']], [['works'], ['work', 'does work', 'working']]),
    practice('What is Nina cooking?', 'thing', 'She is cooking pasta.',
      [['Nina', 'She'], ['He', 'What', 'It']], [['is cooking'], ['cooks', 'is cook', 'cooking']]),
  ],
  elemental2: [
    practice('Where did Jack go last weekend?', 'place', 'He went to the mountains.',
      [['Jack', 'He'], ['She', 'Last weekend', 'It']], [['went'], ['go', 'goed', 'did go']]),
    practice('What is Nina going to buy?', 'thing', 'She is going to buy a new bike.',
      [['Nina', 'She'], ['He', 'What', 'It']], [['is going to buy'], ['is going buy', 'are going to buy', 'going to buy']]),
  ],
  intermedio1: [
    practice('Where did Olivia go on vacation?', 'place', 'She went to Peru.',
      [['Olivia', 'She'], ['He', 'Vacation', 'It']], [['went'], ['go', 'goed', 'did go']]),
    practice('What has Leo just bought?', 'thing', 'He has just bought a car.',
      [['Leo', 'He'], ['She', 'What', 'It']], [['has bought'], ['have bought', 'has buyed', 'has buy']]),
  ],
  intermedio2: [
    practice('Where would Carla live if she could choose?', 'place', 'She would live in Spain.',
      [['Carla', 'She'], ['He', 'Where', 'It']], [['would live'], ['will live', 'would lived', 'lived']]),
    practice('Where did Mark use to live?', 'place', 'He used to live in Boston.',
      [['Mark', 'He'], ['She', 'Where', 'It']], [['used to live'], ['use to live', 'used to lived', 'used live']]),
  ],
}
PRACTICE.basicoInt = [PRACTICE.basico1[1], PRACTICE.basico2[1]]
PRACTICE.elementalInt = [PRACTICE.elemental1[1], PRACTICE.elemental2[1]]
PRACTICE.intermedioInt = [PRACTICE.intermedio1[1], PRACTICE.intermedio2[1]]

/* ───────────── Midterm / End-of-Term Practice ─────────────
   Repaso general de la EA en opción múltiple (Kahoot clásico): una pregunta y
   3–4 alternativas (nunca 2). Varios KC y varios formatos: completar el hueco, elegir la oración correcta, definición → palabra,
   transformar, y el doble hueco, que convierte en 4 opciones lo que por
   naturaleza es binario (bored / boring, simple / continuous).
   Solo KC que se entienden SIN imagen: this/that, colores, comida, in/on/under,
   clima o movimiento esperan a que las preguntas puedan llevar foto.

   mc(prompt, correcta, ...trampas) vive en logic.js. */

const EXAM_BASICO1_EA1 = [
  mc('They ___ from Mexico.', 'are', 'is', 'am', 'be'),
  mc('I ___ a student.', 'am', 'is', 'are'),
  mc('She ___ from Spain. She’s from Italy.', 'isn’t', 'aren’t', 'not', 'don’t'),
  mc('___ is your name?', 'What', 'Where', 'Who', 'How'),
  mc('___ are you from?', 'Where', 'What', 'Who', 'How old'),
  mc('fifty-four = ?', '54', '45', '14', '40'),
  mc('She’s from Brazil. She’s ___.', 'Brazilian', 'Brazilish', 'Brazilese', 'Brazil'),
  mc('He’s from Japan. He’s ___.', 'Japanese', 'Japanian', 'Japanish', 'Japan'),
  mc('one watch, two ___', 'watches', 'watchs', 'watchies', 'watch'),
  mc('Choose the correct question.', 'How old are you?', 'How old you are?', 'How old is you?', 'How many old are you?'),
]

const EXAM_BASICO1_EA2 = [
  mc('This is Tom and ___ wife, Ana.', 'his', 'her', 'he', 'him'),
  mc('We love ___ new house.', 'our', 'us', 'we', 'ours'),
  mc('Choose the correct sentence.', 'This is my sister’s car.', 'This is my sister car.', 'This is my sisters car.', 'This is the car my sister.'),
  mc('Choose the correct sentence.', 'It’s a big car.', 'It’s a car big.', 'It’s big a car.', 'It’s a bigs car.'),
  mc('My brother ___ in a bank.', 'works', 'work', 'working', 'is work'),
  mc('___ you like coffee?', 'Do', 'Does', 'Are', 'Is'),
  mc('She ___ eat meat.', 'doesn’t', 'don’t', 'isn’t', 'not'),
  mc('A person who serves food in a restaurant:', 'a waiter', 'a nurse', 'a pilot', 'a farmer'),
  mc('A nurse works in a ___.', 'hospital', 'school', 'farm', 'bank'),
  mc('Choose the correct sentence.', 'I always have breakfast at home.', 'I have always breakfast at home.', 'Always I have breakfast at home.', 'I have breakfast always at home.'),
]

const EXAM_BASICO2_EA1 = [
  mc('Choose the correct question.', 'Where do you live?', 'Where you live?', 'Where live you?', 'Where does you live?'),
  mc('Choose the correct question.', 'What time does the movie start?', 'What time the movie starts?', 'What time does the movie starts?', 'What time do the movie start?'),
  mc('Where’s Anna? I can’t see ___.', 'her', 'she', 'his', 'they'),
  mc('These are my books. Can you give ___ to me?', 'them', 'they', 'their', 'it'),
  mc('Sorry, you ___ park here.', 'can’t', 'don’t', 'aren’t', 'not can'),
  mc('Can she ___ the guitar?', 'play', 'plays', 'playing', 'to play'),
  mc('I love ___ in the ocean.', 'swimming', 'swim', 'swims', 'to swimming'),
  mc('Look! It ___ now.', 'is raining', 'rains', 'rain', 'raining'),
  mc('I usually ___ to work, but today I ___ the bus.', 'walk / ’m taking', '’m walking / take', 'walk / take', '’m walking / ’m taking'),
  mc('What ___ they doing?', 'are', 'do', 'is', 'does'),
]

const EXAM_BASICO2_EA2 = [
  mc('There ___ two beds in the room.', 'are', 'is', 'be', 'have'),
  mc('___ there a TV in the room?', 'Is', 'Are', 'Has', 'Does'),
  mc('I was ___ home last night.', 'at', 'in', 'on', 'to'),
  mc('Our room is ___ the second floor.', 'on', 'in', 'at', 'under'),
  mc('Where ___ you yesterday?', 'were', 'was', 'did', 'are'),
  mc('I ___ at school last Monday. I was sick.', 'wasn’t', 'weren’t', 'didn’t', 'not was'),
  mc('go → past simple', 'went', 'goed', 'gone', 'wented'),
  mc('study → past simple', 'studied', 'studyed', 'studid', 'studies'),
  mc('___ you have a good weekend?', 'Did', 'Were', 'Do', 'Was'),
  mc('We didn’t ___ a car.', 'have', 'had', 'has', 'having'),
]

const EXAM_ELEMENTAL1_EA1 = [
  mc('___ your parents at home?', 'Are', 'Is', 'Do', 'Does'),
  mc('The day after Tuesday is ___.', 'Wednesday', 'Thursday', 'Monday', 'Friday'),
  mc('They love ___ dog.', 'their', 'there', 'they', 'them'),
  mc('He has ___ apple and ___ banana.', 'an / a', 'a / an', 'a / a', 'an / an'),
  mc('one child, two ___', 'children', 'childs', 'childrens', 'child'),
  mc('Choose the correct sentence.', 'My car is very old.', 'My car is old very.', 'My car very is old.', 'My car is a very old.'),
  mc('My brother ___ TV in the evening.', 'watches', 'watch', 'watchs', 'watching'),
  mc('___ does your sister work? – In a bank.', 'Where', 'What', 'When', 'Who'),
  mc('A person who flies planes:', 'a pilot', 'a driver', 'a waiter', 'a farmer'),
  mc('Choose the correct question.', 'What time do you get up?', 'What time you get up?', 'What time get you up?', 'What time does you get up?'),
]

const EXAM_ELEMENTAL1_EA2 = [
  mc('My birthday is ___ March.', 'in', 'on', 'at', 'to'),
  mc('The class starts ___ 9 o’clock.', 'at', 'in', 'on', 'to'),
  mc('We don’t work ___ Sundays.', 'on', 'in', 'at', 'to'),
  mc('Choose the correct sentence.', 'She is never late.', 'She never is late.', 'Never she is late.', 'She is late never.'),
  mc('I go to the gym three times ___ week.', 'a', 'the', 'in', 'for'),
  mc('Shh! The baby ___.', 'is sleeping', 'sleeps', 'sleep', 'sleeping'),
  mc('He ___ jeans every day, but today he ___ a suit.', 'wears / ’s wearing', '’s wearing / wears', 'wears / wears', '’s wearing / ’s wearing'),
  mc('It’s very cold and there’s snow. It’s ___.', 'winter', 'summer', 'spring', 'fall'),
  mc('I don’t like ___ up early.', 'getting', 'get', 'gets', 'to getting'),
  mc('I ___ a shower every morning.', 'take', 'do', 'make', 'go'),
]

const EXAM_ELEMENTAL2_EA1 = [
  mc('Where ___ you born?', 'were', 'was', 'did', 'are'),
  mc('I saw that movie two weeks ___.', 'ago', 'last', 'before', 'yesterday'),
  mc('We ___ to the beach last summer.', 'went', 'goed', 'go', 'gone'),
  mc('Which word is uncountable?', 'rice', 'apple', 'egg', 'banana'),
  mc('There aren’t ___ eggs in the fridge.', 'any', 'some', 'a', 'much'),
  mc('There ___ a lot of people at the party last night.', 'were', 'was', 'are', 'is'),
  mc('Go ___ the stairs to the second floor.', 'up', 'on', 'in', 'at'),
  mc('How ___ water do you drink a day?', 'much', 'many', 'a lot', 'some'),
  mc('How ___ apples do you want?', 'many', 'much', 'lot', 'any'),
  mc('A train is ___ than a bus.', 'faster', 'more fast', 'fastest', 'the faster'),
]

const EXAM_ELEMENTAL2_EA2 = [
  mc('I ___ going to visit my aunt next week.', 'am', 'is', 'are', 'be'),
  mc('Look at those clouds! It ___ rain.', 'is going to', 'going to', 'is going', 'goes to'),
  mc('She drives very ___.', 'carefully', 'careful', 'care', 'more careful'),
  mc('I want ___ a new phone.', 'to buy', 'buying', 'buy', 'bought'),
  mc('Have you ever ___ sushi?', 'eaten', 'ate', 'eat', 'eating'),
  mc('write → past participle', 'written', 'wrote', 'writed', 'writing'),
  mc('I ___ to Cancún in 2019.', 'went', 'have gone', 'have been', 'go'),
  mc('___ you ever been to Brazil?', 'Have', 'Did', 'Are', 'Has'),
  mc('I ___ Paris twice. I ___ there last year.', '’ve visited / went', 'visited / ’ve gone', '’ve visited / ’ve gone', 'visit / go'),
  mc('You need this to open your email account:', 'a password', 'a charger', 'a battery', 'a screen'),
]

const EXAM_INTERMEDIO1_EA1 = [
  mc('Choose the correct question.', 'How often do you go to the gym?', 'How often you go to the gym?', 'How often go you to the gym?', 'How often does you go to the gym?'),
  mc('He’s very ___. He always smiles and says hello.', 'friendly', 'lazy', 'mean', 'rude'),
  mc('My brother ___ glasses.', 'wears', 'carries', 'brings', 'puts'),
  mc('The bank is ___ the pharmacy and the café.', 'between', 'next', 'in front', 'among'),
  mc('We ___ a great time on vacation last year.', 'had', 'have', 'has', 'did have'),
  mc('The museum opened ___ 1990.', 'in', 'on', 'at', 'since'),
  mc('My flight leaves ___ Friday morning.', 'on', 'in', 'at', 'to'),
  mc('What ___ you going to do this weekend?', 'are', 'do', 'will', 'is'),
  mc('I ___ my cousins tonight. We have a table for 8 o’clock.', '’m meeting', 'meet', 'met', '’m meet'),
  mc('It depends ___ the weather.', 'on', 'of', 'in', 'from'),
]

const EXAM_INTERMEDIO1_EA2 = [
  mc('Have you finished your homework ___?', 'yet', 'already', 'just', 'still'),
  mc('I’ve ___ cleaned the kitchen. It looks great!', 'already', 'yet', 'ever', 'still'),
  mc('I ___ a new laptop last week.', 'bought', 'have bought', 'buy', 'was buy'),
  mc('The movie was ___, so I felt ___.', 'boring / bored', 'bored / boring', 'boring / boring', 'bored / bored'),
  mc('My city isn’t as big ___ yours.', 'as', 'than', 'like', 'that'),
  mc('This is the ___ restaurant I’ve ever been to.', 'best', 'better', 'good', 'most good'),
  mc('It’s the most beautiful city I’ve ever ___.', 'seen', 'saw', 'see', 'seeing'),
  mc('Don’t worry. I think you ___ pass the exam.', 'will', 'are', 'do', 'going'),
  mc('The opposite of “win” is ___.', 'lose', 'miss', 'fail', 'drop'),
  mc('Life in a small town is ___ than in a big city.', 'cheaper', 'more cheap', 'cheapest', 'the cheaper'),
]

const EXAM_INTERMEDIO2_EA1 = [
  mc('I enjoy ___ in the rain.', 'walking', 'to walk', 'walk', 'walked'),
  mc('We decided ___ a taxi.', 'to take', 'taking', 'take', 'took'),
  mc('You ___ smoke here. It’s forbidden.', 'mustn’t', 'don’t have to', 'have to', 'must'),
  mc('Tomorrow is Sunday, so I ___ get up early.', 'don’t have to', 'mustn’t', 'have to', 'must'),
  mc('If it ___ tomorrow, we’ll stay at home.', 'rains', 'will rain', 'rained', 'would rain'),
  mc('If I had more money, I ___ a house.', 'would buy', 'will buy', 'bought', 'buy'),
  mc('I’ve lived here ___ 2015.', 'since', 'for', 'from', 'ago'),
  mc('She has worked here ___ ten years.', 'for', 'since', 'during', 'ago'),
  mc('An insect that makes honey:', 'a bee', 'a butterfly', 'a spider', 'a fly'),
  mc('She plays the piano very ___.', 'well', 'good', 'nice', 'best'),
]

const EXAM_INTERMEDIO2_EA2 = [
  mc('They walked ___ the bridge to the other side of the river.', 'across', 'through', 'into', 'under'),
  mc('The train went ___ a long tunnel.', 'through', 'across', 'over', 'onto'),
  mc('Stop doing something (for example, smoking):', 'give up', 'take up', 'look up', 'turn up'),
  mc('Start a new hobby:', 'take up', 'give up', 'look after', 'turn down'),
  mc('I ___ play tennis when I was a child.', 'used to', 'use to', 'was used to', 'using to'),
  mc('___ you use to walk to school?', 'Did', 'Do', 'Were', 'Used'),
  mc('Take an umbrella. It ___ rain later.', 'might', 'might to', 'mights', 'can to'),
  mc('Marie Curie ___ radium in 1898.', 'discovered', 'invented', 'designed', 'built'),
  mc('The school subject where you study plants and animals:', 'biology', 'chemistry', 'geography', 'physics'),
  mc('___ car is this? – It’s Ana’s.', 'Whose', 'Who', 'Which', 'Who’s'),
]

/* Intensivos: 10 de sus dos cursos, sin lo que ahí es SC, más sus KC propias. */

const EXAM_BASICO_INT_EA1 = pick([...EXAM_BASICO1_EA1, ...EXAM_BASICO1_EA2], [
  'They ___ from Mexico.', 'She ___ from Spain. She’s from Italy.', '___ are you from?',
  'She’s from Brazil. She’s ___.', 'one watch, two ___', 'This is Tom and ___ wife, Ana.',
  'My brother ___ in a bank.', 'She ___ eat meat.', 'A person who serves food in a restaurant:',
  '___ you like coffee?',
])

const EXAM_BASICO_INT_EA2 = [
  // "can", "object pronouns" e "in / on / at" son SC en el intensivo.
  ...pick([...EXAM_BASICO2_EA1, ...EXAM_BASICO2_EA2], [
    'I love ___ in the ocean.', 'Look! It ___ now.', 'What ___ they doing?',
    'There ___ two beds in the room.', '___ there a TV in the room?', 'Where ___ you yesterday?',
    'go → past simple', 'study → past simple', '___ you have a good weekend?',
  ]),
  mc('The pharmacy is ___ the bank. They are side by side.', 'next to', 'across from', 'between', 'behind'),
]

const EXAM_ELEMENTAL_INT_EA1 = pick([...EXAM_ELEMENTAL1_EA1, ...EXAM_ELEMENTAL1_EA2], [
  // "a/an & plurals", adjetivos y el clima son SC en el intensivo.
  '___ your parents at home?', 'They love ___ dog.', 'My brother ___ TV in the evening.',
  '___ does your sister work? – In a bank.', 'What time do you get up?', 'My birthday is ___ March.',
  'She is never late.', 'Shh! The baby ___.', 'He ___ jeans every day, but today he ___ a suit.',
  'I don’t like ___ up early.',
])

const EXAM_ELEMENTAL_INT_EA2 = [
  // "there is / was", "verbs + infinitive" y "phones and the internet" son SC.
  ...pick([...EXAM_ELEMENTAL2_EA1, ...EXAM_ELEMENTAL2_EA2], [
    'Where ___ you born?', 'We ___ to the beach last summer.', 'How ___ water do you drink a day?',
    'A train is ___ than a bus.', 'Look at those clouds! It ___ rain.', 'She drives very ___.',
    'Have you ever ___ sushi?', 'I ___ Paris twice. I ___ there last year.',
  ]),
  mc('It’s ___ building in the city.', 'the tallest', 'the most tall', 'taller', 'tallest'),
  mc('This is the ___ museum in the country.', 'most famous', 'famousest', 'more famous', 'most famousest'),
]

const EXAM_INTERMEDIO_INT_EA1 = [
  ...pick([...EXAM_INTERMEDIO1_EA1, ...EXAM_INTERMEDIO1_EA2], [
    'He’s very ___. He always smiles and says hello.', 'We ___ a great time on vacation last year.',
    'What ___ you going to do this weekend?', 'It depends ___ the weather.', 'Have you finished your homework ___?',
    'I ___ a new laptop last week.', 'The movie was ___, so I felt ___.', 'This is the ___ restaurant I’ve ever been to.',
    'Don’t worry. I think you ___ pass the exam.',
  ]),
  // KC propia del intensivo: make or do
  mc('Every morning I ___ the bed and ___ the dishes.', 'make / do', 'do / make', 'make / make', 'do / do'),
]

const EXAM_INTERMEDIO_INT_EA2 = [
  // "have to / must" y "expressing movement" son SC en el intensivo.
  ...pick([...EXAM_INTERMEDIO2_EA1, ...EXAM_INTERMEDIO2_EA2], [
    'I enjoy ___ in the rain.', 'If it ___ tomorrow, we’ll stay at home.', 'If I had more money, I ___ a house.',
    'I’ve lived here ___ 2015.', 'Stop doing something (for example, smoking):', 'I ___ play tennis when I was a child.',
    'Take an umbrella. It ___ rain later.',
  ]),
  // KC propias: should, orden de los phrasal verbs, past perfect
  mc('You look tired. You ___ go to bed.', 'should', 'should to', 'shoulds', 'would to'),
  mc('Choose the correct sentence.', 'Please turn it off.', 'Please turn off it.', 'Please it turn off.', 'Please turn it of.'),
  mc('When we arrived, the movie ___ already started.', 'had', 'has', 'was', 'did'),
]

/* ───────────── Biblioteca ───────────── */

const regular = (first) => [`Files ${first}–${first + 2}`, `Files ${first + 3}–${first + 5}`]
const INTENSIVE_FILES = ['Files 1–6', 'Files 7–12']

export const ACTIVITY_TYPES = {
  'answer-builder': {
    name: 'Answer Builder',
    description: 'Arman la respuesta a una pregunta abierta: sujeto, verbo con su tiempo y tipo de dato que pide la WH.',
  },
  'exam-practice': {
    name: 'Exam Practice',
    names: ['Midterm Practice', 'End-of-Term Practice'], // EA1 cierra con el midterm, EA2 con el end-of-term
    description: 'Repaso general de la EA estilo Kahoot: varios contenidos KC, 3–4 alternativas por pregunta.',
  },
  'picture-practice': {
    name: 'Picture Practice',
    description: 'Opción múltiple con una imagen por pregunta en el proyector; la pista está en la oración.',
  },
  'grammar-focus': {
    name: 'Grammar Focus',
    description: 'Un solo contenido KC, con distintos formatos de pregunta. Corta: 6 preguntas.',
  },
}

/* Cada EA: [files, temas, Answer Builder, Exam Practice] */
const RAW = [
  { id: 'basico1', level: 'Básico', label: 'I', name: 'Básico I', book: 'American English File Starter A',
    eas: [[regular(1)[0], 'Verb be · Wh- questions with be · Nationalities · Plurals', BASICO1_EA1, EXAM_BASICO1_EA1],
          [regular(1)[1], 'Possessives · Adjectives · Simple present · Adverbs of frequency', BASICO1_EA2, EXAM_BASICO1_EA2]] },
  { id: 'basico2', level: 'Básico', label: 'II', name: 'Básico II', book: 'American English File Starter B',
    eas: [[regular(7)[0], 'Word order in questions · Can · Like + -ing · Present continuous vs simple', BASICO2_EA1, EXAM_BASICO2_EA1],
          [regular(7)[1], 'There is / are · Simple past: be, regular and irregular', BASICO2_EA2, EXAM_BASICO2_EA2]] },
  { id: 'basicoInt', level: 'Básico', label: 'Intensivo', name: 'Básico Intensivo', book: 'American English File Starter',
    eas: [[INTENSIVE_FILES[0], 'Verb be · Possessives · Simple present · Adverbs of frequency', BASICO_INT_EA1, EXAM_BASICO_INT_EA1],
          [INTENSIVE_FILES[1], 'Present continuous · There is / are · Simple past · Directions', BASICO_INT_EA2, EXAM_BASICO_INT_EA2]] },
  { id: 'elemental1', level: 'Elemental', label: 'I', name: 'Elemental I', book: 'American English File 1A',
    eas: [[regular(1)[0], 'Verb be · Simple present · Word order in questions', ELEMENTAL1_EA1, EXAM_ELEMENTAL1_EA1],
          [regular(1)[1], 'Adverbs of frequency · Present continuous vs simple · Like + -ing', ELEMENTAL1_EA2, EXAM_ELEMENTAL1_EA2]] },
  { id: 'elemental2', level: 'Elemental', label: 'II', name: 'Elemental II', book: 'American English File 1B',
    eas: [[regular(7)[0], 'Simple past · There was / were · How much / many · Comparatives', ELEMENTAL2_EA1, EXAM_ELEMENTAL2_EA1],
          [regular(7)[1], 'Be going to · Adverbs · Verbs + infinitive · Present perfect vs past', ELEMENTAL2_EA2, EXAM_ELEMENTAL2_EA2]] },
  { id: 'elementalInt', level: 'Elemental', label: 'Intensivo', name: 'Elemental Intensivo', book: 'American English File 1',
    eas: [[INTENSIVE_FILES[0], 'Verb be · Simple present · Present continuous · Like + -ing', ELEMENTAL_INT_EA1, EXAM_ELEMENTAL_INT_EA1],
          [INTENSIVE_FILES[1], 'Simple past · Comparatives · Be going to · Present perfect', ELEMENTAL_INT_EA2, EXAM_ELEMENTAL_INT_EA2]] },
  { id: 'intermedio1', level: 'Intermedio', label: 'I', name: 'Intermedio I', book: 'American English File 2A',
    eas: [[regular(1)[0], 'Simple present · Simple past · Going to · Present continuous (future)', INTERMEDIO1_EA1, EXAM_INTERMEDIO1_EA1],
          [regular(1)[1], 'Present perfect vs past · Comparatives · Will / won’t', INTERMEDIO1_EA2, EXAM_INTERMEDIO1_EA2]] },
  { id: 'intermedio2', level: 'Intermedio', label: 'II', name: 'Intermedio II', book: 'American English File 2B',
    eas: [[regular(7)[0], 'Infinitive / gerund · Have to · Conditionals · Present perfect + for / since', INTERMEDIO2_EA1, EXAM_INTERMEDIO2_EA1],
          [regular(7)[1], 'Movement · Phrasal verbs · Used to · Might', INTERMEDIO2_EA2, EXAM_INTERMEDIO2_EA2]] },
  { id: 'intermedioInt', level: 'Intermedio', label: 'Intensivo', name: 'Intermedio Intensivo', book: 'American English File 2',
    eas: [[INTENSIVE_FILES[0], 'Simple past · Going to · Present perfect · Will / won’t', INTERMEDIO_INT_EA1, EXAM_INTERMEDIO_INT_EA1],
          [INTENSIVE_FILES[1], 'Conditionals · Should · Used to · Might · Past perfect', INTERMEDIO_INT_EA2, EXAM_INTERMEDIO_INT_EA2]] },
]

const slug = (text) => text.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/* Curso → EA → actividades. El id de Answer Builder no lleva sufijo porque es el
   que ya guardaban las salas abiertas antes de que hubiera más de un tipo. */
export const COURSES = RAW.map((c) => ({
  ...c,
  eas: c.eas.map(([files, topics, builder, exam], i) => {
    const ea = `EA${i + 1}`
    const base = { ea, course: c.id, courseName: c.name, files, topics }
    return {
      ea, files, topics,
      activities: [
        { ...base, id: `${c.id}-ea${i + 1}`, type: 'answer-builder', title: ACTIVITY_TYPES['answer-builder'].name,
          questions: builder, practice: PRACTICE[c.id][i] },
        { ...base, id: `${c.id}-ea${i + 1}-exam`, type: 'exam-practice', title: ACTIVITY_TYPES['exam-practice'].names[i],
          questions: exam },
        ...(PICTURES[c.id]?.[i] ?? []).map((p) => ({
          ...base, id: `${c.id}-ea${i + 1}-pictures-${slug(p.topic)}`, type: 'picture-practice',
          title: `${ACTIVITY_TYPES['picture-practice'].name} · ${p.topic}`, topic: p.topic, questions: p.questions,
        })),
        ...(FOCUS[c.id]?.[i] ?? []).map((f) => ({
          ...base, id: `${c.id}-ea${i + 1}-focus-${slug(f.topic)}`, type: 'grammar-focus',
          title: `${ACTIVITY_TYPES['grammar-focus'].name} · ${f.topic}`, topic: f.topic, questions: f.questions,
        })),
      ],
    }
  }),
}))

export const LEVELS = [...new Set(COURSES.map((c) => c.level))]

export const SETS = COURSES.flatMap((c) => c.eas.flatMap((e) => e.activities))

export const getSet = (id) => SETS.find((s) => s.id === id) ?? SETS[0]

export const courseOf = (set) => COURSES.find((c) => c.id === set.course)

export const eaOf = (set) => courseOf(set).eas.find((e) => e.activities.includes(set))

/* Al cambiar de curso o de EA se conserva el tipo de actividad si existe allí. */
export const sameTypeIn = (ea, type) => ea.activities.find((a) => a.type === type) ?? ea.activities[0]
