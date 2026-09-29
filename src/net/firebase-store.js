import { initializeApp } from 'firebase/app'
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp,
} from 'firebase/database'

export function createFirebaseStore(config) {
  const db = getDatabase(initializeApp(config))

  /* Todos los relojes se alinean al del servidor: el cronómetro del celular y el
     del proyector deben terminar al mismo tiempo aunque un reloj esté corrido. */
  let offset = 0
  onValue(ref(db, '.info/serverTimeOffset'), (s) => { offset = s.val() || 0 })

  return {
    online: true,
    get: async (path) => (await get(ref(db, path))).val(),
    set: (path, value) => set(ref(db, path), value),
    update: (path, values) => update(ref(db, path), values),
    remove: (path) => remove(ref(db, path)),
    listen: (path, cb) => onValue(ref(db, path), (s) => cb(s.val())),
    now: () => Date.now() + offset,
    stamp: () => serverTimestamp(),
    /* Al reconectar (el celular se bloqueó, cambió de WiFi a datos) se vuelve a
       marcar en línea y se re-arma el aviso de desconexión. */
    presence(path) {
      const node = ref(db, path)
      const unsub = onValue(ref(db, '.info/connected'), async (s) => {
        if (!s.val()) return
        await onDisconnect(node).set(false)
        set(node, true)
      })
      return () => { unsub(); onDisconnect(node).cancel() }
    },
  }
}
