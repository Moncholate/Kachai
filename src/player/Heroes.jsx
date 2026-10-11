/* Los personajes en el celular (ver game/heroes.js): el selector del lobby, el
   duelo del ranking y el podio. Solo en el modo individual; el celular no
   suena (el sonido es del proyector). */
import { useEffect, useMemo, useRef } from 'react'
import { HEROES, escenaAplauso, escenaDuelo, escenaDuelo2, escenaGana, escenaGana2, escenaPodio, pintarRetrato } from '../game/heroes.js'
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

/* El personaje entero en guardia (con su arma), centrado por su contorno real. */
const LADO = 48
const centrado = (g, hero, t = 0) => pintarRetrato(g, hero, LADO, t)

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
    centrado(g, hero, t)
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
