import { useState } from 'react'
import { WH_TYPES, isChoice } from '../game/logic.js'
import { MAX_OPTIONS, MAX_QUESTIONS, MIN_OPTIONS, libraryPath, questionErrors, setErrors } from '../game/library.js'
import { ACTIVITY_TYPES } from '../game/sets.js'
import { Button } from '../ui.jsx'

/* Editor de una actividad para la biblioteca personal del docente. Trabaja sobre
   un borrador; nada se guarda hasta "Guardar", y "Restaurar original" borra la
   versión personal para volver a la de la biblioteca base. */

const splitList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean)
const joinList = (items) => items.join(', ')

function toDraft(q) {
  if (isChoice(q)) return { kind: 'choice', prompt: q.prompt, options: [...q.options], correct: Math.max(0, q.options.indexOf(q.answer)) }
  return {
    kind: 'builder', prompt: q.prompt, wh: q.wh, example: q.example ?? '',
    subjectAccept: joinList(q.subject.accept), subjectDistractors: joinList(q.subject.distractors),
    verbAccept: joinList(q.verb.accept), verbDistractors: joinList(q.verb.distractors),
  }
}

function fromDraft(d) {
  if (d.kind === 'choice') {
    const options = d.options.map((o) => o.trim())
    return { prompt: d.prompt.trim(), answer: options[d.correct] ?? '', options }
  }
  return {
    prompt: d.prompt.trim(), wh: d.wh, example: d.example.trim(),
    subject: { accept: splitList(d.subjectAccept), distractors: splitList(d.subjectDistractors) },
    verb: { accept: splitList(d.verbAccept), distractors: splitList(d.verbDistractors) },
  }
}

const blank = (kind) => (kind === 'choice'
  ? { kind, prompt: '', options: ['', '', '', ''], correct: 0 }
  : { kind, prompt: '', wh: 'place', example: '', subjectAccept: '', subjectDistractors: '', verbAccept: '', verbDistractors: '' })

export default function Editor({ store, user, base, custom, onClose }) {
  const kind = isChoice(base.questions[0]) ? 'choice' : 'builder'
  const [drafts, setDrafts] = useState(() => (custom ?? base).questions.map(toDraft))
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

  const questions = drafts.map(fromDraft)
  const errors = questions.map(questionErrors)
  const general = setErrors(questions)
  const invalid = general.length > 0 || errors.some((e) => e.length)
  const path = `${libraryPath(user.uid)}/${base.id}`

  async function save() {
    setSaving(true)
    try {
      await store.set(path, { questions, updatedAt: store.stamp() })
      onClose()
    } catch (e) {
      alert(`No se pudo guardar: ${e.message}`)
      setSaving(false)
    }
  }
  async function restore() {
    if (!confirm('¿Volver a la versión original? Se perderán tus cambios en esta actividad.')) return
    await store.remove(path)
    onClose()
  }

  return (
    <section className="max-w-4xl mx-auto flex flex-col gap-4 pb-28">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-500">Editando tu versión de</p>
          <h2 className="text-2xl font-black truncate">{base.courseName} · {base.ea} · {base.title}</h2>
          <p className="text-sm text-slate-500">
            {ACTIVITY_TYPES[base.type].name} · Los cambios son solo tuyos ({user.name}); los demás docentes siguen viendo la original.
          </p>
        </div>
        {custom && <Button variant="danger" className="!py-2 text-sm" onClick={restore}>Restaurar original</Button>}
      </div>

      {drafts.map((d, i) => (
        <article key={i} className={`rounded-2xl bg-white border-2 p-4 flex flex-col gap-3 ${errors[i].length ? 'border-rose-300' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className="w-8 font-black text-slate-400">{i + 1}</span>
            <input value={d.prompt} onChange={(e) => change(i, { prompt: e.target.value })}
              placeholder={kind === 'choice' ? 'Pregunta (usa ___ para el hueco)' : 'Pregunta abierta (Where did…?)'}
              className="flex-1 min-w-0 rounded-xl border-2 border-slate-200 px-3 py-2 font-bold focus:border-[#0F6FD6] outline-none" />
            <IconButton title="Subir" disabled={i === 0} onClick={() => move(i, -1)}>↑</IconButton>
            <IconButton title="Bajar" disabled={i === drafts.length - 1} onClick={() => move(i, 1)}>↓</IconButton>
            <IconButton title="Eliminar pregunta" disabled={drafts.length === 1} onClick={() => remove(i)}>🗑</IconButton>
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
        <button onClick={() => setDrafts((ds) => [...ds, blank(kind)])}
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
