/* Picture Practice: opción múltiple con una imagen por pregunta (solo en el
   proyector). Las imágenes van en public/images/<carpeta>/ y viajan con la app,
   no con Firebase.

   Regla de diseño: la imagen muestra la acción y NADA MÁS. Todas con el mismo
   formato (una escena, sin relojes ni calendarios): si la forma de la imagen
   delatara la respuesta, nadie leería la oración. La pista del tiempo va en la
   oración (every day, usually… / Look!, Shh!, right now…).

   El orden ya viene intercalado, para que tampoco "En orden" deje las cinco de
   rutina seguidas. */

import { mc } from './logic.js'

const pictures = (topic, folder, ...questions) => ({
  topic,
  questions: questions.map(([n, ...q]) => ({ ...mc(...q), image: `images/${folder}/${n}.jpg` })),
})

const PS_VS_PC = pictures('Present simple vs continuous', 'ps-vs-pc',
  [1, 'Lucas ___ his teeth twice a day.', 'brushes', 'is brushing', 'brush'],
  [6, 'Shh! The baby ___.', 'is sleeping', 'sleeps', 'are sleeping'],
  [7, 'Take an umbrella! It ___ right now.', 'is raining', 'rains', 'rain'],
  [2, 'My parents ___ in the park every Sunday.', 'run', 'are running', 'runs'],
  [8, 'Look! Emma and Mia ___ on the stage!', 'are dancing', 'dance', 'is dancing'],
  [3, 'Sophie always ___ her cat before school.', 'feeds', 'is feeding', 'feed'],
  [4, 'Tom ___ bread for the whole town every day.', 'bakes', 'is baking', 'bake'],
  [9, 'Dad can’t answer the phone. He ___ the car.', 'is washing', 'washes', 'wash'],
  [5, 'Grandpa usually ___ the newspaper after breakfast.', 'reads', 'is reading', 'read'],
  [10, 'Be quiet! Olivia ___ for her exam at the moment.', 'is studying', 'studies', 'study'],
)

/* Curso → [EA1, EA2]. Va donde el KC "present continuous vs simple" está en la hoja de ruta. */
export const PICTURES = {
  basico2: [[PS_VS_PC], []],
  basicoInt: [[], [PS_VS_PC]],
  elemental1: [[], [PS_VS_PC]],
  elementalInt: [[PS_VS_PC], []],
}
