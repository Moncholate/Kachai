import { firebaseConfig } from './firebase-config.js'

/* Una sola interfaz para los dos transportes, así el juego no sabe cuál usa:
     get(path)            → Promise<valor | null>
     set(path, value)     · update(path, {k: v})  (v null = borrar) · remove(path)
     listen(path, cb)     → unsubscribe; cb(valor | null)
     now()                → hora estimada del servidor (ms)
     stamp()              → marca de tiempo que resuelve el SERVIDOR al escribir
     presence(path)       → true mientras la pestaña esté conectada, false al cerrarla;
                            → cleanup (no escribe: la sala puede estar ya borrada)
     onUser(cb)           → unsubscribe; cb({ uid, name, photo } | null) con la sesión del docente
     signIn() · signOut() → iniciar / cerrar sesión con Google (solo el docente, para editar)

   "?local" en la URL fuerza el modo local aunque haya Firebase: sirve para probar
   sin crear salas ni bibliotecas en la base real. */
const forceLocal = typeof location !== 'undefined' && new URLSearchParams(location.search).has('local')
export const isOnline = Boolean(firebaseConfig) && !forceLocal

let pending
export function getStore() {
  pending ??= isOnline
    ? import('./firebase-store.js').then((m) => m.createFirebaseStore(firebaseConfig))
    : import('./local-store.js').then((m) => m.createLocalStore())
  return pending
}
