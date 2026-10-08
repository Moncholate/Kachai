/* ============================================================================
   EL QR QUE SE AGRANDA
   ----------------------------------------------------------------------------
   Chico donde esté (lobby o esquina del juego), con el ícono de agrandar ⤢.
   Al tocarlo VIAJA desde su lugar al centro mientras crece, y el fondo se
   oscurece; al cerrar vuelve a su lugar. Pedido el 8-oct-2026: escanear un QR
   al costado de la pantalla costaba, y el salto directo a una foto grande no
   se entendía como «el mismo código, más grande».

   La animación es FLIP: se mide dónde está el chico y dónde queda el grande,
   y el grande parte transformado encima del chico. Con «reducir movimiento»
   activado en el sistema, aparece sin viajar.

   Hay una copia en Liveboard (src/live/QrAmpliable.jsx): si cambia uno,
   cambiar el otro.
   ========================================================================== */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const DURACION = 420
const CURVA = 'cubic-bezier(.2, .8, .2, 1)'
const sinMovimiento = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* Dos flechas hacia esquinas opuestas: «agrandar». */
export function IconoAgrandar({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
    </svg>
  )
}

/**
 * `src` = el QR (data URL, en alta resolución: se usa chico y grande).
 * `claseQr` = el tamaño del chico (`insigniaChica` para el de la esquina, donde
 * el ⤢ normal taparía medio código). `children` = lo que va bajo el chico
 * (PIN, «Únete»). `grande` = lo que acompaña al grande (título arriba con
 * `titulo`, y `pie` abajo: PIN, enlace).
 */
export function QrAmpliable({ src, alt, etiqueta, claseQr = 'w-16 h-16', insigniaChica = false, className = '', titulo, pie, cerrarTexto, children }) {
  const [abierto, setAbierto] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const chico = useRef(null)
  const grande = useRef(null)
  const fondo = useRef(null)
  const tarjeta = useRef(null)
  const caja = useRef(null)
  /* La tarjeta blanca y lo escrito (título, PIN) aparecen juntos, detrás del
     QR que llega viajando. */
  const acompanan = () => [tarjeta.current, ...(caja.current?.querySelectorAll('[data-acompana]') || [])]

  /* Desde dónde y hasta dónde: el grande parte encima del chico. */
  const viaje = () => {
    const a = chico.current?.getBoundingClientRect()
    const b = grande.current?.getBoundingClientRect()
    if (!a || !b || !b.width) return null
    const dx = a.left + a.width / 2 - (b.left + b.width / 2)
    const dy = a.top + a.height / 2 - (b.top + b.height / 2)
    return `translate(${dx}px, ${dy}px) scale(${a.width / b.width})`
  }

  useLayoutEffect(() => {
    if (!abierto || cerrando || sinMovimiento()) return
    const desde = viaje()
    if (!desde) return
    grande.current.animate([{ transform: desde }, { transform: 'none' }], { duration: DURACION, easing: CURVA })
    fondo.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURACION * 0.6, easing: 'ease-out' })
    for (const el of acompanan()) {
      el.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }],
        { duration: DURACION, delay: DURACION * 0.35, easing: CURVA, fill: 'backwards' })
    }
  }, [abierto])

  const cerrar = () => {
    if (cerrando) return
    if (sinMovimiento()) { setAbierto(false); return }
    setCerrando(true)
    const hasta = viaje()
    const opciones = { duration: DURACION * 0.8, easing: CURVA, fill: 'forwards' }
    for (const el of acompanan()) el.animate([{ opacity: 1 }, { opacity: 0 }], { ...opciones, duration: DURACION * 0.4 })
    fondo.current.animate([{ opacity: 1 }, { opacity: 0 }], opciones)
    const fin = grande.current.animate([{ transform: 'none' }, { transform: hasta || 'scale(.2)' }], opciones)
    fin.onfinish = () => { setAbierto(false); setCerrando(false) }
  }

  useEffect(() => {
    if (!abierto) return
    const tecla = (e) => e.key === 'Escape' && cerrar()
    addEventListener('keydown', tecla)
    return () => removeEventListener('keydown', tecla)
  }, [abierto, cerrando])

  return (
    <>
      <button onClick={() => setAbierto(true)} title={etiqueta} aria-label={etiqueta}
        className={`group relative flex flex-col items-center ${className}`}>
        <span className="relative">
          {/* Mientras está grande, el chico queda vacío: es el mismo código que viajó. */}
          <img ref={chico} src={src} alt="" className={`${claseQr} ${abierto ? 'invisible' : ''}`} />
          <span className={`absolute grid place-items-center rounded-full ${insigniaChica ? '-right-2.5 -bottom-2.5 w-5 h-5' : '-right-3 -bottom-3 w-7 h-7'} bg-[#0F6FD6] text-white shadow-md ring-2 ring-white transition group-hover:scale-110`}>
            <IconoAgrandar className={insigniaChica ? 'w-3 h-3' : 'w-4 h-4'} />
          </span>
        </span>
        {children}
      </button>

      {/* En un portal, directo en <body>: dentro de una columna «sticky» quedaba
          atrapado en su capa y otros botones de la página le pasaban por encima. */}
      {abierto && createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center p-6 cursor-zoom-out" onClick={cerrar}>
          <div ref={fondo} className="absolute inset-0 bg-slate-900/75" />
          {/* Blanca también en modo oscuro (colores en línea): un QR sobre fondo
              oscuro se escanea peor. */}
          <div ref={caja} className="relative flex flex-col items-center gap-3 text-center" style={{ color: '#0f172a' }}>
            <div ref={tarjeta} className="absolute -inset-8 rounded-3xl shadow-2xl" style={{ backgroundColor: '#ffffff' }} />
            {titulo && <p data-acompana className="relative font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{titulo}</p>}
            <img ref={grande} src={src} alt={alt} className="relative w-[min(60vh,80vw)] h-[min(60vh,80vw)]" style={{ willChange: 'transform' }} />
            {pie && <div data-acompana className="relative">{pie}</div>}
            {cerrarTexto && <p data-acompana className="relative text-sm" style={{ color: '#64748b' }}>{cerrarTexto}</p>}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
