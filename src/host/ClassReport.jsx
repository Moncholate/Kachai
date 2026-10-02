import { reportCsv } from '../game/report.js'
import { Button, Prompt, ROLES, RoleTag } from '../ui.jsx'

/* Resumen del curso para el profesor (ver game/report.js). Todo lo de arriba se
   puede proyectar: datos del curso y destacados en positivo. El detalle por
   alumno va plegado y avisado, para no exponer a nadie frente al curso. */

const PART_LABEL = { subject: 'Subject', verb: 'Verb', wh: 'Information' }
const tone = (rate) => (rate >= 75 ? 'bg-green-500' : rate >= 50 ? 'bg-amber-400' : 'bg-rose-500')

export default function ClassReport({ report, title, closeLabel, onClose }) {
  const { overall, parts, weakestPart, hardest, highlights, questions, students } = report

  const download = () => {
    const blob = new Blob(['﻿' + reportCsv(report, title)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kachai-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <section className="max-w-5xl mx-auto flex flex-col gap-5 pb-24">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-4xl font-black">📊 Class report</h2>
          <p className="text-slate-500 font-bold">{title}</p>
        </div>
        <Button variant="ghost" onClick={onClose}>{closeLabel}</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi value={`${overall.accuracy}%`} label="fully correct answers" accent={tone(overall.accuracy)} />
        <Kpi value={`${overall.participation}%`} label="participation" accent={tone(overall.participation)} />
        <Kpi value={overall.students} label="students" />
        <Kpi value={overall.questions} label="questions" />
      </div>

      {parts && (
        <Card title="🧩 Answer Builder · by part">
          <div className="grid md:grid-cols-3 gap-3">
            {Object.keys(PART_LABEL).map((p) => (
              <div key={p} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <RoleTag part={p} />
                  <span className="ml-auto text-2xl font-black tabular-nums">{parts[p]}%</span>
                </div>
                <Bar rate={parts[p]} className={ROLES[p].solid} />
              </div>
            ))}
          </div>
          {parts[weakestPart] < 100 && (
            <p className="mt-3 text-lg">
              Hardest part: <b className={ROLES[weakestPart].text}>{PART_LABEL[weakestPart]}</b> ({parts[weakestPart]}% right)
              {weakestPart === 'verb' && ' — the verb carries the tense: “did … work” → “worked”.'}
              {weakestPart === 'subject' && ' — remember: the answer’s subject, not the question’s (“you” → “I”).'}
              {weakestPart === 'wh' && ' — what kind of information does the wh-word ask for?'}
            </p>
          )}
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="🔁 Review together">
          {hardest.length === 0
            ? <p className="text-lg">Everyone got everything right! 🎉</p>
            : (
              <ol className="flex flex-col gap-3">
                {hardest.map((q) => (
                  <li key={q.index} className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-slate-400">Q{q.index + 1}</span>
                      <Prompt text={q.prompt} highlightWh={q.kind !== 'choice'} className="flex-1 text-lg" />
                      <span className={`rounded-full px-2 text-sm font-black text-white ${tone(q.correctRate)}`}>{q.correctRate}%</span>
                    </div>
                    <p className="pl-8 font-bold text-green-700">✓ {q.solution}</p>
                    <Mistake q={q} />
                  </li>
                ))}
              </ol>
            )}
        </Card>

        <Card title="🌟 Highlights">
          <ul className="flex flex-col gap-2 text-lg">
            {highlights.mvp && <li>⭐ <b>{highlights.mvp.name}</b> — MVP, {highlights.mvp.total} points</li>}
            {highlights.perfect.length > 0 && <li>💯 All correct: <b>{highlights.perfect.join(', ')}</b></li>}
            {highlights.streak && <li>🔥 Longest streak: <b>{highlights.streak.name}</b>, {highlights.streak.streak} in a row</li>}
            {highlights.improved && <li>📈 Most improved: <b>{highlights.improved.name}</b> (+{highlights.improved.improvement}% in the second half)</li>}
            {!highlights.mvp && <li className="text-slate-500">Play a game to see highlights.</li>}
          </ul>
        </Card>
      </div>

      <Card title="📋 Question by question">
        <ol className="flex flex-col gap-3">
          {questions.map((q) => (
            <li key={q.index} className="grid grid-cols-[2.5rem_1fr_9rem] items-center gap-x-3 gap-y-1">
              <span className="font-black text-slate-400">Q{q.index + 1}</span>
              <Prompt text={q.prompt} highlightWh={q.kind !== 'choice'} className="text-base truncate" />
              <div className="flex items-center gap-2">
                <Bar rate={q.correctRate} className={tone(q.correctRate)} />
                <span className="w-12 text-right font-black tabular-nums">{q.correctRate}%</span>
              </div>
              <span />
              <Mistake q={q} compact />
            </li>
          ))}
        </ol>
      </Card>

      <details className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-5">
        <summary className="cursor-pointer font-black text-lg">
          👁 Detalle por alumno <span className="font-bold text-amber-700">— solo para ti: evita proyectarlo</span>
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-slate-500">
              <tr><th className="py-1">Alumno</th><th>Puntos</th><th>Correctas</th><th>Respondió</th><th>Falló en</th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-1.5 font-bold">{s.name}</td>
                  <td className="tabular-nums">{s.total}</td>
                  <td className="tabular-nums">{s.correct}/{overall.questions}</td>
                  <td className="tabular-nums">{s.answered}/{overall.questions}</td>
                  <td className="text-sm text-slate-600">{s.missed.length ? s.missed.map((n) => `Q${n}`).join(', ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="ghost" className="mt-4 text-sm" onClick={download}>⬇ Descargar CSV (Excel)</Button>
      </details>
    </section>
  )
}

function Mistake({ q, compact = false }) {
  const cls = compact ? 'text-sm text-slate-500' : 'pl-8 text-sm text-slate-600'
  if (q.topWrong) return <p className={cls}>Most common mistake: <b className="text-rose-600">“{q.topWrong.text}”</b> ({q.topWrong.count})</p>
  if (q.weakestPart) return <p className={cls}>Most missed part: <b className={ROLES[q.weakestPart].text}>{PART_LABEL[q.weakestPart]}</b></p>
  if (q.answeredRate < 100) return <p className={cls}>{100 - q.answeredRate}% didn’t answer</p>
  return compact ? <span /> : null
}

function Kpi({ value, label, accent = 'bg-slate-300' }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 flex flex-col gap-1">
      <span className={`h-1.5 w-10 rounded-full ${accent}`} />
      <span className="text-4xl font-black tabular-nums">{value}</span>
      <span className="text-sm font-bold text-slate-500">{label}</span>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5">
      <h3 className="text-xl font-black mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Bar({ rate, className }) {
  return (
    <div className="h-3 w-full min-w-0 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${rate}%` }} />
    </div>
  )
}
