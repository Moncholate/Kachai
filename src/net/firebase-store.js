import { initializeApp } from 'firebase/app'
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp,
} from 'firebase/database'

export function createFirebaseStore(config) {
  const app = initializeApp(config)
  const db = getDatabase(app)
  /* La sesión solo la usa el docente para editar su biblioteca: el módulo de
     auth se carga cuando se pide, así los celulares no lo descargan. */
  let authMod
  const auth = async () => {
    authMod ??= await import('firebase/auth')
    return { ...authMod, auth: authMod.getAuth(app) }
  }
  const toUser = (u) => (u ? { uid: u.uid, name: u.displayName || u.email, photo: u.photoURL } : null)

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
    onUser(cb) {
      let unsub = () => {}
      let cancelled = false
      auth().then(({ auth, onAuthStateChanged }) => {
        if (!cancelled) unsub = onAuthStateChanged(auth, (u) => cb(toUser(u)))
      })
      return () => { cancelled = true; unsub() }
    },
    async signIn() {
      const { auth: a, GoogleAuthProvider, signInWithPopup } = await auth()
      return toUser((await signInWithPopup(a, new GoogleAuthProvider())).user)
    },
    async signOut() {
      const { auth: a, signOut } = await auth()
      await signOut(a)
    },
    now: () => Date.now() + offset,
    stamp: () => serverTimestamp(),
    /* Al reconectar (el celular se bloqueó, cambió de WiFi a datos) se vuelve a
       marcar en línea y se re-arma el aviso de desconexión.
       MIRANDO O NO (8-oct-2026): con la pantalla bloqueada o en otra app, el
       celular queda «fuera» al tiro, y vuelve apenas regresa a Kachai. Antes
       seguía «conectado» hasta que Firebase notaba el corte (un minuto o más)
       y el proyector lo esperaba para avanzar aunque nadie estuviera mirando. */
    presence(path) {
      const node = ref(db, path)
      const mirando = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
      let conectado = false
      const unsub = onValue(ref(db, '.info/connected'), async (s) => {
        conectado = Boolean(s.val())
        if (!conectado) return
        await onDisconnect(node).set(false)
        set(node, mirando())
      })
      const alCambiar = () => { if (conectado) set(node, mirando()) }
      document.addEventListener('visibilitychange', alCambiar)
      return () => { unsub(); onDisconnect(node).cancel(); document.removeEventListener('visibilitychange', alCambiar) }
    },
  }
}
