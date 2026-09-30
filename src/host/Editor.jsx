import { useRef, useState } from 'react'
import { WH_TYPES } from '../game/logic.js'
import {
  MAX_IMAGE_CHARS, MAX_IMAGE_SIDE, MAX_OPTIONS, MAX_QUESTIONS, MIN_OPTIONS, imageError, questionErrors, setErrors,
} from '../game/library.js'
import { Button } from '../ui.jsx'

/* Editor de actividades de la biblioteca personal. Trabaja sobre un borrador:
   nada se guarda hasta "Guardar".

     mechanic      'choice' (opción múltiple) | 'builder' (Answer Builder)
     questions     las preguntas con que se abre
     titled        la actividad tiene título editable (las creadas desde cero)
     onSave(questions, title) · onDiscard() → "Restaurar original" o "Eliminar"
     discardLabel  el texto de ese botón; sin él, no aparece */

const splitList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean)
const joinList = (items) => items.join(', ')

function toDraft(q, mechanic) {
  const image = q.image ?? ''
  if (mechanic === 'choice') {
    return { kind: 'choice', prompt: q.prompt, options: [...q.options], correct: Math.max(0, q.options.indexOf(q.answer)), image }
  }
  return {
    kind: 'builder', prompt: q.prompt, wh: q.wh, example: q.example ?? '', image,
    subjectAccept: joinList(q.subject.accept), subjectDistractors: joinList(q.subject.distractors),
    verbAccept: joinList(q.verb.accept), verbDistractors: joinList(q.verb.distractors),
  }
}

function fromDraft(d) {
  const image = d.image ? { image: d.image } : {}
  if (d.kind === 'choice') {
    const options = d.options.map((o) => o.trim())
    return { prompt: d.prompt.trim(), answer: options[d.correct] ?? '', options, ...image }
  }
  return {
    prompt: d.prompt.trim(), wh: d.wh, example: d.example.trim(), ...image,
    subject: { accept: splitList(d.subjectAccept), distractors: splitList(d.subjectDistractors) },
    verb: { accept: splitList(d.verbAccept), distractors: splitList(d.verbDistractors) },
  }
}

export const blankQuestion = (mechanic) => fromDraft(mechanic === 'choice'
  ? { kind: 'choice', prompt: '', options: ['', '', '', ''], correct: 0, image: '' }
  : { kind: 'builder', prompt: '', wh: 'place', example: '', image: '', subjectAccept: '', subjectDistractors: '', verbAccept: '', verbDistractors: '' })

export default function Editor({ heading, subheading, mechanic, questions, titled, title: initialTitle = '', onSave, onDiscard, discardLabel, onClose }) {
  const [drafts, setDrafts] = useState(() => questions.map((q) => toDraft(q, mechanic)))
  const [title, setTitle] = useState(initialTitle)
  const [saving, setSaving] = useState(false)

  const change = (i, patch) => setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const remove = (i) => setDrafts((ds) => ds.filter((_, j) => j !== i))
  const move = (i, by) => setDrafts((ds) => {
    const next = [...ds]
    const j = i + by
    if (j < 0 || j >= next.length) return ds
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

  const result = drafts.map(fromDraft)
  const errors = result.map(questionErrors)
  const general = [...(titled && !title.trim() ? ['Ponle un título a la actividad.'] : []), ...setErrors(result)]
  const invalid = general.length > 0 || errors.some((e) => e.length)

  async function save() {
    setSaving(true)
    try {
      await onSave(result, title.trim())
      onClose()
    } catch (e) {
      alert(`No se pudo guardar: ${e.message}`)
      setSaving(false)
    }
  }

  return (
    <section className="max-w-4xl mx-auto flex flex-col gap-4 pb-28">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-500">{heading}</p>
          {titled
            ? <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} placeholder="Título de la actividad"
                className="w-full text-2xl font-black bg-transparent border-b-2 border-slate-300 focus:border-[#0F6FD6] outline-none" />
            : <h2 className="text-2xl font-black truncate">{initialTitle}</h2>}
          <p className="text-sm text-slate-500">{subheading}</p>
        </div>
        {discardLabel && <Button variant="danger" className="!py-2 text-sm" onClick={async () => { if (await onDiscard()) onClose() }}>{discardLabel}</Button>}
      </div>

      {drafts.map((d, i) => (
        <article key={i} className={`rounded-2xl bg-white border-2 p-4 flex flex-col gap-3 ${errors[i].length ? 'border-rose-300' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className="w-8 font-black text-slate-400">{i + 1}</span>
            <input value={d.prompt} onChange={(e) => change(i, { prompt: e.target.value })}
              placeholder={mechanic === 'choice' ? 'Pregunta (usa ___ para el hueco)' : 'Pregunta abierta (Where did…?)'}
              className="flex-1 min-w-0 rounded-xl border-2 border-slate-200 px-3 py-2 font-bold focus:border-[#0F6FD6] outline-none" />
            <IconButton title="Subir" disabled={i === 0} onClick={() => move(i, -1)}>↑</IconButton>
            <IconButton title="Bajar" disabled={i === drafts.length - 1} onClick={() => move(i, 1)}>↓</IconButton>
            <IconButton title="Eliminar pregunta" disabled={drafts.length === 1} onClick={() => remove(i)}>🗑</IconButton>
          </div>

          <div className="pl-10">
            <ImageField value={d.image} onChange={(image) => change(i, { image })} />
          </div>

          {d.kind === 'choice' ? (
            <div className="flex flex-col gap-2 pl-10">
              {d.options.map((o, k) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${i}`} checked={d.correct === k} onChange={() => change(i, { correct: k })}
                    className="w-5 h-5 accent-green-600" title="Alternativa correcta" />
                  <input value={o} placeholder={`Alternativa ${k + 1}`}
                    onChange={(e) => change(i, { options: d.options.map((x, j) => (j === k ? e.target.value : x)) })}
                    className={`flex-1 min-w-0 rounded-lg border-2 px-3 py-1.5 outline-none ${d.correct === k ? 'border-green-500 bg-green-50' : 'border-slate-200 focus:border-slate-400'}`} />
                  <IconButton title="Quitar alternativa" disabled={d.options.length <= MIN_OPTIONS}
                    onClick={() => change(i, {
                      options: d.options.filter((_, j) => j !== k),
                      correct: d.correct === k ? 0 : d.correct > k ? d.correct - 1 : d.correct,
                    })}>×</IconButton>
                </label>
              ))}
              {d.options.length < MAX_OPTIONS && (
                <button onClick={() => change(i, { options: [...d.options, ''] })}
                  className="self-start text-sm font-bold text-[#0F6FD6] hover:underline">+ Agregar alternativa</button>
              )}
              <p className="text-xs text-slate-500">Marca con ● la correcta. De {MIN_OPTIONS} a {MAX_OPTIONS} alternativas.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 pl-10">
              <Labeled label="Tipo de dato que pide">
                <select value={d.wh} onChange={(e) => change(i, { wh: e.target.value })}
                  className="w-full rounded-lg border-2 border-slate-200 px-2 py-1.5">
                  {Object.entries(WH_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Labeled>
              <Labeled label="Respuesta modelo">
                <Text value={d.example} onChange={(example) => change(i, { example })} placeholder="He lives in London." />
              </Labeled>
              <Labeled label="Sujeto correcto (separa con comas)">
                <Text value={d.subjectAccept} onChange={(subjectAccept) => change(i, { subjectAccept })} placeholder="Tom, He" />
              </Labeled>
              <Labeled label="Trampas de sujeto">
                <Text value={d.subjectDistractors} onChange={(subjectDistractors) => change(i, { subjectDistractors })} placeholder="She, Where, It" />
              </Labeled>
              <Labeled label="Verbo correcto (separa con comas)">
                <Text value={d.verbAccept} onChange={(verbAccept) => change(i, { verbAccept })} placeholder="lives" />
              </Labeled>
              <Labeled label="Trampas de verbo">
                <Text value={d.verbDistractors} onChange={(verbDistractors) => change(i, { verbDistractors })} placeholder="live, does live, living" />
              </Labeled>
            </div>
          )}

          {errors[i].length > 0 && (
            <ul className="pl-10 text-sm font-bold text-rose-600">{errors[i].map((e) => <li key={e}>• {e}</li>)}</ul>
          )}
        </article>
      ))}

      {drafts.length < MAX_QUESTIONS && (
        <button onClick={() => setDrafts((ds) => [...ds, toDraft(blankQuestion(mechanic), mechanic)])}
          className="rounded-2xl border-2 border-dashed border-slate-300 p-4 font-bold text-slate-500 hover:border-slate-400 hover:text-slate-700">
          + Agregar pregunta ({drafts.length} / {MAX_QUESTIONS})
        </button>
      )}

      <div className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-slate-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <p className={`flex-1 text-sm font-bold ${invalid ? 'text-rose-600' : 'text-slate-500'}`}>
            {general[0] ?? (invalid ? 'Corrige las preguntas marcadas en rojo para guardar.' : `${drafts.length} preguntas listas.`)}
          </p>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={invalid || saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </section>
  )
}

/* Reduce la foto a MAX_IMAGE_SIDE px como máximo (en el proyector se ve igual) y la pasa a JPEG, bajando la calidad
   hasta que entre en MAX_IMAGE_CHARS. Fondo blanco por si trae transparencia. */
async function compressImage(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  for (const quality of [0.8, 0.7, 0.6, 0.5, 0.4]) {
    const url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_IMAGE_CHARS) return url
  }
  throw new Error('La imagen es demasiado grande incluso comprimida. Prueba con otra más simple.')
}

function ImageField({ value, onChange }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const pick = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      onChange(await compressImage(file))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }
  const pasteLink = () => {
    const url = prompt('Pega el enlace de la imagen (https://…)')?.trim()
    if (url) onChange(url)
  }

  if (value) {
    return (
      <div className="flex items-start gap-3">
        <img src={value} alt="Imagen de la pregunta" className="h-28 max-w-[14rem] object-contain rounded-lg border border-slate-200 bg-slate-50" />
        <div className="flex flex-col gap-1 text-sm">
          <button onClick={() => input.current.click()} className="font-bold text-[#0F6FD6] hover:underline text-left">Cambiar imagen</button>
          <button onClick={() => onChange('')} className="font-bold text-rose-600 hover:underline text-left">Quitar imagen</button>
          {imageError(value) == null && value.startsWith('data:') && (
            <span className="text-xs text-slate-400">{Math.round((value.length * 3) / 4 / 1024)} KB</span>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <button onClick={() => input.current.click()} disabled={busy} className="font-bold text-[#0F6FD6] hover:underline disabled:opacity-50">
        {busy ? 'Procesando…' : '🖼 Agregar imagen'}
      </button>
      <button onClick={pasteLink} className="font-bold text-slate-500 hover:underline">🔗 Pegar enlace</button>
      <span className="text-xs text-slate-400">Opcional · se ve en el proyector</span>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
    </div>
  )
}

function IconButton({ children, ...props }) {
  return (
    <button {...props}
      className="w-8 h-8 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent">
      {children}
    </button>
  )
}

function Labeled({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Text({ value, onChange, placeholder }) {
  return (
    <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border-2 border-slate-200 px-3 py-1.5 outline-none focus:border-slate-400" />
  )
}
