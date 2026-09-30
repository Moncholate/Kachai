import { STREAK_MIN, splitWh } from './game/logic.js'

/* Colores de rol del Grammar Hub (design-tokens): sujeto azul, verbo rojo grave,
   wh teal. Clases literales para que Tailwind las encuentre. */
export const ROLES = {
  subject: {
    label: 'Subject', text: 'text-blue-600', solid: 'bg-blue-600 border-blue-600',
    tint: 'bg-blue-50', border: 'border-blue-600',
  },
  verb: {
    label: 'Verb', text: 'text-red-700', solid: 'bg-red-700 border-red-700',
    tint: 'bg-red-50', border: 'border-red-700',
  },
  wh: {
    label: 'Information', text: 'text-teal-700', solid: 'bg-teal-700 border-teal-700',
    tint: 'bg-teal-50', border: 'border-teal-700',
  },
}
export const PART_KEYS = ['subject', 'verb', 'wh']

export function Logo({ className = '' }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      Kach<span className="text-[#0F6FD6]">ai</span>
    </span>
  )
}

export function Center({ children }) {
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center text-slate-600">
      <div>{children}</div>
    </div>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-[#0F6FD6] text-white hover:bg-[#0B5CB3] disabled:bg-slate-300',
    ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50',
    danger: 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50',
  }
  return (
    <button
      className={`rounded-xl px-5 py-3 font-bold transition active:scale-[.98] disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

/* highlightWh: colorea la wh-word (Answer Builder). Sin ella el texto va tal
   cual, salvo los huecos "___", que se dibujan como línea para completar. */
export function Prompt({ text, highlightWh = true, className = '' }) {
  if (!highlightWh) {
    return (
      <p className={`font-extrabold text-slate-900 leading-tight ${className}`}>
        {text.split(/(_{3,})/).map((part, i) => (/^_{3,}$/.test(part)
          ? <span key={i} className="inline-block w-[3em] border-b-4 border-slate-400 mx-1 align-baseline" />
          : part))}
      </p>
    )
  }
  const [wh, rest] = splitWh(text)
  return (
    <p className={`font-extrabold text-slate-900 leading-tight ${className}`}>
      <span className="text-teal-700">{wh}</span>
      {rest}
    </p>
  )
}

/* Colores y figuras de las alternativas de opción múltiple (como Kahoot): la
   figura ayuda a encontrar en el celular la misma opción que se ve proyectada. */
export const CHOICE_STYLES = [
  { shape: '▲', solid: 'bg-rose-600', ring: 'ring-rose-600', text: 'text-rose-700' },
  { shape: '◆', solid: 'bg-blue-600', ring: 'ring-blue-600', text: 'text-blue-700' },
  { shape: '●', solid: 'bg-amber-500', ring: 'ring-amber-500', text: 'text-amber-700' },
  { shape: '■', solid: 'bg-green-600', ring: 'ring-green-600', text: 'text-green-700' },
]

/* Alternativas largas (oraciones completas) van en una columna. */
export const choiceCols = (options) => (options.some((o) => o.length > 22) ? 'grid-cols-1' : 'grid-cols-2')

export function TimerBar({ start, ms, now, className = '' }) {
  const ready = typeof start === 'number'
  const left = ready ? Math.max(0, start + ms - now) : ms
  const pct = (left / ms) * 100
  const urgent = left < 5000
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-3 flex-1 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${urgent ? 'bg-rose-500' : 'bg-[#0F6FD6]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`tabular-nums font-black text-xl w-10 text-right ${urgent ? 'text-rose-600' : 'text-slate-700'}`}>
        {Math.ceil(left / 1000)}
      </span>
    </div>
  )
}

/* 🔥 N junto al nombre mientras dure una racha de STREAK_MIN o más. */
export function StreakBadge({ streak, className = '' }) {
  if (!(streak >= STREAK_MIN)) return null
  return (
    <span title={`${streak} correct in a row`}
      className={`inline-flex items-center gap-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 font-black px-2 leading-tight tabular-nums ${className}`}>
      🔥 {streak}
    </span>
  )
}

export function RoleTag({ part, className = '' }) {
  const r = ROLES[part]
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white ${r.solid} ${className}`}>
      {r.label}
    </span>
  )
}
