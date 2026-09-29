# Kachai

Juego en vivo para practicar **cómo responder preguntas de comprensión lectora**.
El profesor proyecta una pregunta (*Where did María work yesterday?*) y cada
alumno, desde su celular, identifica las tres piezas de la respuesta:

| Pieza | Ejemplo | Qué entrena |
|---|---|---|
| **Subject** | María / She | quién es el sujeto de la respuesta (ojo: *you* → *I*) |
| **Verb** | worked | el verbo con su carga temporal (*did … work* → *worked*) |
| **Information** | a place | qué tipo de dato pide la wh-word |

Cada pieza correcta vale un tercio de 1000 puntos, y la rapidez multiplica
(×1 al instante, ×0,5 en el último segundo), como en Kahoot.

## Cómo funciona

- **La app** es estática y se publica gratis en GitHub Pages.
- **El navegador del profesor** es el "servidor" de la actividad: baraja,
  lleva el cronómetro, corrige y reparte los puntos.
- **Firebase Realtime Database** (plan gratuito Spark) solo transporta los
  mensajes entre el proyector y los celulares. Admite 100 conexiones simultáneas.

Sin Firebase configurado, la app corre en **modo local**: la sala se comparte
solo entre pestañas del mismo navegador. Sirve para probar.

## Probar en local

```bash
npm install
npm run dev
```

1. Abre `http://localhost:5175/#/host` → se crea una sala con un PIN.
2. Abre otra pestaña con el enlace que aparece bajo el QR, y únete con un nombre.
   Cada pestaña es un alumno distinto.

## Configurar Firebase (una vez, ~10 min)

1. Entra a <https://console.firebase.google.com> → **Agregar proyecto**
   (puedes desactivar Google Analytics).
2. Menú **Compilación → Realtime Database → Crear base de datos**.
   Ubicación: la que ofrezca (us-central1 sirve). Empieza en **modo bloqueado**.
3. Pestaña **Reglas**: pega el contenido de `database.rules.json` y **Publicar**.
4. **Configuración del proyecto** (engranaje) → **Tus apps** → ícono web `</>`
   → registra la app (sin Hosting) y copia el objeto `firebaseConfig`.
5. Pégalo en `src/net/firebase-config.js` en lugar de `null`.
   Asegúrate de que incluya `databaseURL`.

## Publicar en GitHub Pages

1. Crea un repositorio y sube el proyecto a la rama `main`.
2. En GitHub: **Settings → Pages → Source: GitHub Actions**.
3. Cada push a `main` corre los tests, compila y publica
   (`.github/workflows/deploy.yml`).

Los alumnos entran escaneando el QR del proyector o con el PIN en
`https://<tu-usuario>.github.io/<repo>/`.

## Música

Suena solo en la pantalla del profesor (`src/host/sound.js`); los celulares
quedan en silencio. Los navegadores no dejan sonar nada hasta el primer clic
en la página: el botón "Activar sonido" de la cabecera lo resuelve.

| Fase | Archivo | |
|---|---|---|
| Sala, revelar, ranking | `public/audio/lobby.ogg` | loop |
| Lectura y respuesta | `public/audio/answering.ogg` | loop + tics en los últimos 5 s |
| Podio | `public/audio/podium.ogg` | una vez |

Los loops están cortados en un compás y con un fundido cruzado hecho sobre el
original, así que repiten sin salto. Los originales (`audio source/`) no se
suben al repositorio.

## Agregar preguntas

Edita `src/game/sets.js`. Cada pregunta define los sujetos y el verbo
aceptados, trampas típicas como distractores, el tipo de información
(`place`, `time`, `person`, `thing`, `action`, `reason`, `manner`,
`quantity`, `frequency`, `duration`) y una respuesta modelo. `npm test`
verifica que ninguna trampa sea también una respuesta válida.

## Seguridad (prototipo)

No hay cuentas: los alumnos solo dan un apodo. Las reglas impiden listar las
salas, cambiar una respuesta ya enviada o falsificar su hora. Aun así, alguien
con conocimientos técnicos y el PIN podría alterar una partida. Para uso en aula
es razonable, y más adelante se puede agregar autenticación anónima.
