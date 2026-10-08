/* ============================================================================
   LAS SALAS QUE QUEDARON ABIERTAS
   ----------------------------------------------------------------------------
   Una sala se borra con «Cerrar sala». Si el proyector se cierra sin eso, la
   sala queda en la base con nombres y puntajes, sin fin (8-oct-2026: había
   muchas). Sin servidor (plan Spark), la limpia el mismo Kachai, igual que
   Liveboard:

     · cada computador anota las salas que abrió (localStorage);
     · con sesión de Google, también en la cuenta: libraries/{uid}/rooms
       { pin: createdAt }, para limpiarlas desde cualquier computador;
     · al abrir Kachai se borran las de más de 12 horas. Nunca la que está en
       uso.

   ANTES DE BORRAR se mira que la sala sea la misma (`meta.createdAt`): un PIN
   que se liberó puede tenerlo hoy la sala de otro docente.

   Una sala abierta en un computador que no se vuelve a usar, y sin sesión,
   queda hasta que se borre en la consola: cubrir eso pide un servidor.
   ========================================================================== */
export const ROOM_LIFE_MS = 12 * 60 * 60 * 1000

const KEY = 'kachai-salas'
export const readRooms = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const writeRooms = (r) => { try { localStorage.setItem(KEY, JSON.stringify(r)) } catch { /* modo privado */ } }

export const accountRoomsPath = (uid) => `libraries/${uid}/rooms`

/** ¿Pasaron más de 12 horas? Sin hora conocida, no se toca. */
export const isOld = (createdAt, now) => typeof createdAt === 'number' && now - createdAt > ROOM_LIFE_MS

/** Las de una lista { pin: createdAt } que ya hay que borrar, salvo la actual. */
export const oldRooms = (rooms, now, current = null) => Object.entries(rooms || {})
  .filter(([pin, createdAt]) => pin !== current && isOld(createdAt, now))

/** Borra la sala solo si sigue siendo la que se abrió a esa hora. */
export async function removeIfSame(store, pin, createdAt) {
  const meta = await store.get(`rooms/${pin}/meta`)
  if (meta && meta.createdAt === createdAt) await store.remove(`rooms/${pin}`)
}

export function noteRoom(store, pin, createdAt, uid = null) {
  if (typeof createdAt !== 'number') return
  writeRooms({ ...readRooms(), [pin]: createdAt })
  if (uid) store.set(`${accountRoomsPath(uid)}/${pin}`, createdAt).catch(() => {})
}

export function forgetRoom(store, pin, uid = null) {
  const r = readRooms()
  delete r[pin]
  writeRooms(r)
  if (uid) store.remove(`${accountRoomsPath(uid)}/${pin}`).catch(() => {})
}

/** Borra las viejas anotadas en este computador y, con `uid`, en la cuenta. */
export async function cleanOldRooms(store, { current = null, uid = null } = {}) {
  const now = store.now()
  const local = readRooms()
  for (const [pin, createdAt] of oldRooms(local, now, current)) {
    await removeIfSame(store, pin, createdAt).catch(() => {})
    delete local[pin]
  }
  writeRooms(local)
  if (!uid) return
  const inAccount = await store.get(accountRoomsPath(uid)).catch(() => null)
  for (const [pin, createdAt] of oldRooms(inAccount, now, current)) {
    await removeIfSame(store, pin, createdAt).catch(() => {})
    await store.remove(`${accountRoomsPath(uid)}/${pin}`).catch(() => {})
  }
}
