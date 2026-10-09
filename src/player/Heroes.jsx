/* Los personajes en el celular (ver game/heroes.js): el selector del lobby, el
   duelo del ranking y el podio. Solo en el modo individual; el celular no
   suena (el sonido es del proyector). */
import { useEffect, useMemo, useRef } from 'react'
import { HEROES, escenaAplauso, escenaDuelo, escenaDuelo2, escenaGana, escenaGana2, escenaPodio, sprite } from '../game/heroes.js'
import { useT } from '../i18n.jsx'

const CLASE_EN = {
  latte: 'Trickster', agattita: 'Druid', malala: 'Witch', malia: 'Chef', kenny: 'Bard',
  tivan: 'Alchemist', patroclus: 'Scout', uchis: 'Rogue', janet: 'Elf', jelic: 'Paladin', cupe: 'Noble', july: 'Blacksmith', edith: 'Warlock', uzu: 'Goblin', xitin: 'Summoner',
}
export const claseDe = (hero, idioma) => (idioma === 'en' ? CLASE_EN[hero.id] : hero.clase)

const PIXEL = { imageRendering: 'pixelated' }

/* Lienzo animado: llama a dibujar(g, ms desde que apareció) en cada cuadro. */
function Lienzo({ dibujar, ancho = 112, alto = 76, label, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const g = ref.current.getContext('2d')
    const inicio = performance.now()
    let id
    const cuadro = (now) => { dibujar(g, now - inicio); id = requestAnimationFrame(cuadro) }
    id = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(id)
  }, [dibujar])
  return <canvas ref={ref} width={ancho} height={alto} aria-label={label} style={PIXEL} className={className} />
}

const ESCENA = 'w-full rounded-2xl border-4 border-slate-900'

/* Duelo del ranking: chocan; si ganaste (adelantaste a tu rival), lo desarmas.
   me y rival son un personaje, o dos (modo equipos: dos contra dos). */
export function HeroDuel({ me, rival, won }) {
  const a = [].concat(me), b = [].concat(rival)
  const dos = a.length > 1 && b.length > 1
  const clave = [...a, ...b].map((h) => h.id).join('|')
  const dibujar = useMemo(() => (dos
    ? (won ? (g, t) => escenaGana2(g, t, a, b) : (g, t) => escenaDuelo2(g, t, a, b))
    : (won ? (g, t) => escenaGana(g, t, a[0], b[0]) : (g, t) => escenaDuelo(g, t, a[0], b[0]))), [clave, dos, won])
  return <Lienzo dibujar={dibujar} label={`${a.map((h) => h.nombre).join(' + ')} vs ${b.map((h) => h.nombre).join(' + ')}`} className={ESCENA} />
}

/* Podio: salta al salir su nombre, levanta el arma y cae confeti. */
export function HeroPodium({ me, place }) {
  const dibujar = useMemo(() => (g, t) => escenaPodio(g, t, me, place), [me, place])
  return <Lienzo dibujar={dibujar} label={me.nombre} className={ESCENA} />
}

/* Quien no quedó en el podio: aplaude. */
export function HeroApplause({ me }) {
  const dibujar = useMemo(() => (g, t) => escenaAplauso(g, t, me), [me])
  return <Lienzo dibujar={dibujar} label={me.nombre} className={ESCENA} />
}

/* El personaje entero en guardia (con su arma), centrado por su contorno real:
   cada dibujo ocupa distinto espacio en su lienzo y, sin esto, quedaban cargados a un lado. */
const marcos = new Map()
function marco(hero) {
  if (marcos.has(hero.id)) return marcos.get(hero.id)
  const spr = sprite(hero, 'guardia'), { width: w, height: h } = spr
  const d = spr.getContext('2d').getImageData(0, 0, w, h).data
  let x0 = w, y0 = h, x1 = 0, y1 = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  const m = { spr, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
  marcos.set(hero.id, m)
  return m
}
const LADO = 44
const centrado = (g, hero, dy = 0) => {
  const m = marco(hero)
  g.drawImage(sprite(hero, 'guardia'), Math.round((LADO - m.w) / 2 - m.x), Math.round((LADO - m.h) / 2 - m.y) + dy)   // se pide de nuevo: el de Xitin palpita
}

function Cara({ hero }) {
  const ref = useRef(null)
  useEffect(() => {
    const g = ref.current.getContext('2d')
    g.clearRect(0, 0, LADO, LADO)
    centrado(g, hero)
  }, [hero])
  return <canvas ref={ref} width={LADO} height={LADO} style={PIXEL} className="w-full h-full" />
}

function EnGuardia({ hero }) {
  const dibujar = useMemo(() => (g, t) => {
    g.clearRect(0, 0, LADO, LADO)
    centrado(g, hero, Math.floor(t / 400) % 2)
  }, [hero])
  return <Lienzo dibujar={dibujar} ancho={LADO} alto={LADO} label={hero.nombre} className="w-24 shrink-0" />
}

/* En el lobby: diez caras para tocar y la ficha del elegido. */
export function HeroPicker({ value, onPick }) {
  const t = useT()
  const elegido = HEROES.find((h) => h.id === value)
  return (
    <div className="mt-6 w-full flex flex-col gap-3">
      <h3 className="text-center font-black text-lg text-slate-900">{t('eligePersonaje')}</h3>
      <div className="grid grid-cols-5 gap-2">
        {HEROES.map((h) => (
          <button key={h.id} type="button" onClick={() => onPick(h.id)} aria-pressed={h.id === value} aria-label={h.nombre}
            className={`aspect-square rounded-xl border-2 p-0.5 bg-indigo-950 transition active:scale-95 ${h.id === value ? 'border-amber-400 ring-2 ring-amber-400' : 'border-indigo-800'}`}>
            <Cara hero={h} />
          </button>
        ))}
      </div>
      {elegido && (
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-950 text-white p-3 text-left">
          <EnGuardia hero={elegido} />
          <div className="min-w-0">
            <b className="block text-amber-300">{elegido.nombre}</b>
            <span className="block text-sm text-indigo-200">{claseDe(elegido, t.idioma)}</span>
            <i className="block text-sm mt-1">“{elegido.frase}”</i>
          </div>
        </div>
      )}
    </div>
  )
}
