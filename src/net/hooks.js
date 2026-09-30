import { useEffect, useState } from 'react'
import { getStore } from './store.js'

export function useStore() {
  const [store, setStore] = useState(null)
  useEffect(() => { getStore().then(setStore) }, [])
  return store
}

/* undefined = cargando · null = no existe. Con path null no escucha nada. */
export function useValue(store, path) {
  const [value, setValue] = useState(undefined)
  useEffect(() => {
    setValue(undefined)
    if (!store || !path) return
    return store.listen(path, setValue)
  }, [store, path])
  return value
}

/* Sesión del docente: undefined = comprobando · null = sin sesión. */
export function useUser(store) {
  const [user, setUser] = useState(undefined)
  useEffect(() => (store ? store.onUser(setUser) : undefined), [store])
  return user
}

export function useNow(store, ms = 200) {
  const [now, setNow] = useState(() => (store ? store.now() : Date.now()))
  useEffect(() => {
    if (!store) return
    const id = setInterval(() => setNow(store.now()), ms)
    return () => clearInterval(id)
  }, [store, ms])
  return now
}
