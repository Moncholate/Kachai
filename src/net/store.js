import { firebaseConfig } from './firebase-config.js'

/* Una sola interfaz para los dos transportes, así el juego no sabe cuál usa:
     get(path)            → Promise<valor | null>
     set(path, value)     · update(path, {k: v})  (v null = borrar) · remove(path)
     listen(path, cb)     → unsubscribe; cb(valor | null)
     now()                → hora estimada del servidor (ms)
     stamp()              → marca de tiempo que resuelve el SERVIDOR al escribir
     presence(path)       → true mientras la pestaña esté conectada, false al cerrarla;
                            → cleanup (no escribe: la sala puede estar ya borrada) */
export const isOnline = Boolean(firebaseConfig)

let pending
export function getStore() {
  pending ??= isOnline
    ? import('./firebase-store.js').then((m) => m.createFirebaseStore(firebaseConfig))
    : import('./local-store.js').then((m) => m.createLocalStore())
  return pending
}
