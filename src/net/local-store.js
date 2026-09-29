/* Imitación mínima de Realtime Database sobre localStorage + BroadcastChannel.
   El árbol completo vive en localStorage; cada escritura relee, aplica, guarda y
   avisa a las otras pestañas. Solo para probar en un navegador. */
const KEY = 'kachai-local-db'
const segs = (p) => p.split('/').filter(Boolean)

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}

function getAt(tree, path) {
  let node = tree
  for (const k of segs(path)) {
    if (node == null || typeof node !== 'object') return null
    node = node[k]
  }
  return node === undefined ? null : node
}

function setAt(tree, path, value) {
  const ks = segs(path)
  if (!ks.length) return value ?? {}
  let node = tree
  for (const k of ks.slice(0, -1)) {
    if (node[k] == null || typeof node[k] !== 'object') node[k] = {}
    node = node[k]
  }
  if (value == null) delete node[ks.at(-1)]
  else node[ks.at(-1)] = JSON.parse(JSON.stringify(value))
  return tree
}

export function createLocalStore() {
  const channel = new BroadcastChannel('kachai-local')
  const listeners = new Set()

  function notify() {
    const tree = load()
    for (const l of listeners) {
      const json = JSON.stringify(getAt(tree, l.path))
      if (json !== l.last) { l.last = json; l.cb(JSON.parse(json)) }
    }
  }
  channel.onmessage = notify

  function write(mutate) {
    const tree = mutate(load())
    localStorage.setItem(KEY, JSON.stringify(tree))
    channel.postMessage('changed')
    notify()
    return Promise.resolve()
  }

  return {
    online: false,
    get: (path) => Promise.resolve(getAt(load(), path)),
    set: (path, value) => write((t) => setAt(t, path, value)),
    update: (path, values) =>
      write((t) => Object.entries(values).reduce((acc, [k, v]) => setAt(acc, `${path}/${k}`, v), t)),
    remove: (path) => write((t) => setAt(t, path, null)),
    listen(path, cb) {
      const l = { path, cb, last: undefined }
      listeners.add(l)
      setTimeout(() => {
        if (!listeners.has(l)) return
        l.last = JSON.stringify(getAt(load(), path))
        cb(JSON.parse(l.last))
      }, 0)
      return () => listeners.delete(l)
    },
    now: () => Date.now(),
    stamp: () => Date.now(),
    presence(path) {
      const off = () => this.set(path, false)
      this.set(path, true)
      addEventListener('pagehide', off)
      return () => removeEventListener('pagehide', off)
    },
  }
}
