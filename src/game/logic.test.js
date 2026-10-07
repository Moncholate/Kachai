import { describe, expect, it } from 'vitest'
import { buildPublicQuestion, playOrder, playedQuestions, checkAnswer, historyEntry, historyKey, isChoice, nextStreak, normalize, reviewQuestion, scoreFor, solutionOf, splitWh, subjectAccept, UNISEX_NAMES, WH_TYPES } from './logic.js'
import { ACTIVITY_TYPES, COURSES, SETS, getSet, sameTypeIn } from './sets.js'

const q = { prompt: 'Where did María work yesterday?', wh: 'place', example: 'She worked at the hospital.',
  subject: { accept: ['María', 'She'], distractors: ['He', 'Yesterday', 'They'] },
  verb: { accept: ['worked'], distractors: ['work', 'works', 'did work'] } }

describe('checkAnswer', () => {
  it('acepta nombre o pronombre, sin importar tildes ni mayúsculas', () => {
    expect(checkAnswer(q, { subject: 'maria', verb: 'WORKED', wh: 'place' })).toEqual([true, true, true])
    expect(checkAnswer(q, { subject: ' she ', verb: 'worked', wh: 'place' })).toEqual([true, true, true])
  })
  it('marca cada parte por separado', () => {
    expect(checkAnswer(q, { subject: 'He', verb: 'did work', wh: 'place' })).toEqual([false, false, true])
    expect(checkAnswer(q, {})).toEqual([false, false, false])
  })
})

describe('scoreFor', () => {
  it('1000 si todo es correcto al instante, 500 en el último segundo', () => {
    expect(scoreFor([true, true, true], 0, 30000)).toBe(1000)
    expect(scoreFor([true, true, true], 30000, 30000)).toBe(500)
  })
  it('cada parte vale un tercio y nada correcto vale 0', () => {
    expect(scoreFor([true, false, false], 0, 30000)).toBe(333)
    expect(scoreFor([false, false, false], 0, 30000)).toBe(0)
  })
})

describe('normalize', () => {
  it('limpia tildes, apóstrofes curvos y espacios', () => {
    expect(normalize('  María’s  ')).toBe("maria's")
  })
})

describe('splitWh', () => {
  it('reconoce wh compuestas', () => {
    expect(splitWh('How many cats does Peter have?')[0]).toBe('How many')
    expect(splitWh('What time do you get up?')[0]).toBe('What time')
    expect(splitWh('Where does Tom live?')[0]).toBe('Where')
  })
})

const builders = SETS.filter((s) => s.type === 'answer-builder')
const choices = SETS.filter((s) => s.questions.some(isChoice))

describe('Answer Builder', () => {
  for (const set of builders) {
    for (const item of [set.practice, ...set.questions]) {
      it(`${set.id} · ${item.prompt}`, () => {
        expect(WH_TYPES[item.wh]).toBeDefined()
        for (const part of ['subject', 'verb']) {
          const accept = item[part].accept.map(normalize)
          expect(accept.length).toBeGreaterThan(0)
          // una trampa nunca puede ser también respuesta válida
          for (const d of item[part].distractors) expect(accept).not.toContain(normalize(d))
        }
        // nada de nombres unisex: con «Sam» no se sabe si va he o she
        for (const a of item.subject.accept) expect(UNISEX_NAMES.has(normalize(a))).toBe(false)
        const pub = buildPublicQuestion(item)
        expect(pub.whOptions).toContain(item.wh)
        expect(new Set(pub.whOptions).size).toBe(4)
        // lo que viaja a los celulares no lleva la solución
        expect(JSON.stringify(pub)).not.toContain('accept')
      })
    }
  }
})

describe('opción múltiple', () => {
  for (const set of choices) {
    for (const item of set.questions) {
      it(`${set.id} · ${item.prompt} → ${item.answer}`, () => {
        expect(isChoice(item)).toBe(true)
        // 3 o 4 alternativas: nunca 2 (demasiado adivinable) ni más de las 4 figuras
        expect(item.options.length).toBeGreaterThanOrEqual(3)
        expect(item.options.length).toBeLessThanOrEqual(4)
        expect(item.options).toContain(item.answer)
        expect(new Set(item.options.map(normalize)).size).toBe(item.options.length)
        const pub = buildPublicQuestion(item)
        expect([...pub.options].sort()).toEqual([...item.options].sort())
        expect(pub).not.toHaveProperty('answer')
        expect(checkAnswer(item, { choice: item.answer })).toEqual([true])
        for (const o of item.options.filter((x) => x !== item.answer)) expect(checkAnswer(item, { choice: o })).toEqual([false])
      })
    }
  }
  it('una sola parte: acertar rápido vale 1000', () => {
    expect(scoreFor([true], 0, 20000)).toBe(1000)
    expect(scoreFor([false], 0, 20000)).toBe(0)
  })
})

describe('biblioteca', () => {
  it('9 cursos; cada EA1 y EA2 con Answer Builder y su Exam Practice', () => {
    expect(COURSES).toHaveLength(9)
    for (const c of COURSES) {
      expect(c.eas.map((e) => e.ea)).toEqual(['EA1', 'EA2'])
      for (const e of c.eas) expect(e.activities.slice(0, 2).map((a) => a.type)).toEqual(['answer-builder', 'exam-practice'])
      expect(c.eas.map((e) => e.activities[1].title)).toEqual(['Midterm Practice', 'End-of-Term Practice'])
    }
  })
  it('surtidas: entre 10 y 15 preguntas (15 ya es demasiado para una clase)', () => {
    for (const s of SETS.filter((x) => x.type !== 'grammar-focus')) {
      expect(s.questions.length).toBeGreaterThanOrEqual(10)
      expect(s.questions.length).toBeLessThanOrEqual(15)
    }
  })
  it('Grammar Focus: cortas (6 a 15) y en los cursos del semestre', () => {
    const focus = SETS.filter((x) => x.type === 'grammar-focus')
    for (const s of focus) {
      expect(s.questions.length).toBeGreaterThanOrEqual(6)
      expect(s.questions.length).toBeLessThanOrEqual(15)
      expect(s.title).toBe(`Grammar Focus · ${s.topic}`)
    }
    for (const id of ['basico2', 'elemental1', 'intermedio1', 'intermedioInt']) {
      for (const e of COURSES.find((c) => c.id === id).eas) {
        expect(e.activities.filter((a) => a.type === 'grammar-focus').length).toBeGreaterThanOrEqual(4)
      }
    }
  })
  it('ids únicos y sin preguntas repetidas dentro de un set', () => {
    expect(new Set(SETS.map((s) => s.id)).size).toBe(SETS.length)
    const key = (x) => `${x.prompt}|${x.answer ?? ''}`
    for (const s of SETS) expect(new Set(s.questions.map(key)).size).toBe(s.questions.length)
  })
  it('cada Answer Builder practica al menos 4 tipos de wh distintos', () => {
    for (const s of builders) expect(new Set(s.questions.map((x) => x.wh)).size).toBeGreaterThanOrEqual(4)
  })
  it('al cambiar de EA se conserva el tipo de actividad', () => {
    const ea2 = COURSES[0].eas[1]
    expect(sameTypeIn(ea2, 'exam-practice').type).toBe('exam-practice')
    expect(sameTypeIn(ea2, 'no-existe')).toBe(ea2.activities[0])
  })
  it('cada Answer Builder tiene su pregunta de práctica, distinta de las del juego', () => {
    for (const s of builders) {
      expect(s.practice).toBeDefined()
      expect(s.questions.map((x) => x.prompt)).not.toContain(s.practice.prompt)
    }
  })
  it('cada set declara un tipo de actividad conocido', () => {
    for (const s of SETS) expect(ACTIVITY_TYPES[s.type]).toBeDefined()
  })
  it('un setId viejo o desconocido cae en el primero; los de antes siguen valiendo', () => {
    expect(getSet('a1')).toBe(SETS[0])
    expect(getSet('basico1-ea2').type).toBe('answer-builder')
  })
})

describe('nextStreak', () => {
  it('suma solo con las tres partes bien y se corta con cualquier fallo', () => {
    expect(nextStreak(undefined, [true, true, true])).toBe(1)
    expect(nextStreak(2, [true, true, true])).toBe(3)
    expect(nextStreak(5, [true, true, false])).toBe(0)
    expect(nextStreak(5, [false, false, false])).toBe(0)
  })
})

describe('resumen final', () => {
  it('guarda por pregunta lo respondido, las partes y los puntos', () => {
    expect(historyKey(3)).toBe('q3')
    const choice = { prompt: 'Q?', answer: 'a', options: ['a', 'b', 'c'] }
    expect(historyEntry(choice, { choice: 'b', at: 123 }, [false], 0)).toEqual({ parts: [false], gain: 0, answer: { choice: 'b' } })
    expect(historyEntry(q, { subject: 'She', verb: 'worked', wh: 'place', at: 1 }, [true, true, true], 900).answer)
      .toEqual({ subject: 'She', verb: 'worked', wh: 'place' })
    expect(historyEntry(q, null, [false, false, false], 0).answer).toBeNull()
  })
  it('la pregunta del resumen lleva la solución pero no la imagen', () => {
    const withImage = { prompt: 'Q?', answer: 'a', options: ['a', 'b', 'c'], image: 'data:image/jpeg;base64,AAAA' }
    expect(reviewQuestion(withImage)).toEqual({ prompt: 'Q?', answer: 'a', options: ['a', 'b', 'c'], hasImage: true })
    expect(reviewQuestion(q)).toEqual(q)
  })
})

describe('música de responder', () => {
  it('rota: ninguna pregunta repite el tema de la anterior, y cada juego parte distinto', async () => {
    const { answeringTrack, ANSWERING_TRACKS } = await import('../host/sound.js')
    const game = (round) => Array.from({ length: 11 }, (_, i) => answeringTrack(round, i - 1)) // incluye la de práctica
    for (const round of [1, 2, 3]) {
      const tracks = game(round)
      for (let i = 1; i < tracks.length; i++) expect(tracks[i]).not.toBe(tracks[i - 1])
      expect(new Set(tracks).size).toBe(ANSWERING_TRACKS.length)
    }
    expect(game(1)[1]).not.toBe(game(2)[1])
  })
})

describe('sonidos del podio', () => {
  it('redoble que termina al aparecer cada puesto; fanfarria propia para 3.º y 2.º; la larga para el 1.º', async () => {
    const { PODIUM_AT, PODIUM_SOUNDS, SOUND_MS } = await import('./podium.js')
    const len = (c) => SOUND_MS[c.effect] ?? 0
    const rolls = PODIUM_SOUNDS.filter((c) => c.effect?.startsWith('drumroll'))
    expect(rolls.map((c) => c.at + len(c))).toEqual([PODIUM_AT.third, PODIUM_AT.second, PODIUM_AT.first])
    expect(PODIUM_SOUNDS.filter((c) => c.effect?.startsWith('fanfare')).map((c) => [c.at, c.effect]))
      .toEqual([[PODIUM_AT.third, 'fanfareThird'], [PODIUM_AT.second, 'fanfareSecond']])
    expect(PODIUM_SOUNDS.find((c) => c.music)).toEqual({ at: PODIUM_AT.first, music: 'podium' })
    // nada se corta ni se pisa: cada fanfarria termina completa antes del redoble siguiente
    const seq = [...rolls, ...PODIUM_SOUNDS.filter((c) => c.effect?.startsWith('fanfare'))].sort((a, b) => a.at - b.at)
    for (let i = 1; i < seq.length; i++) expect(seq[i].at).toBeGreaterThanOrEqual(seq[i - 1].at + len(seq[i - 1]))
    // el 4.º lugar en adelante y los botones, después del campeón
    expect(PODIUM_AT.rest).toBeGreaterThan(PODIUM_AT.first)
    for (const c of PODIUM_SOUNDS) expect(c.at).toBeGreaterThanOrEqual(0)
  })
})

describe('nombres unisex', () => {
  const q = (accept, distractors = ['Where', 'It']) => ({
    prompt: 'Where does Sam work?', wh: 'place',
    subject: { accept, distractors }, verb: { accept: ['works'], distractors: ['work'] },
  })
  it('con Sam valen He y She, aunque el docente solo haya escrito uno', () => {
    const item = q(['Sam', 'He'], ['She', 'Where', 'It'])
    expect(checkAnswer(item, { subject: 'She', verb: 'works', wh: 'place' })).toEqual([true, true, true])
    expect(checkAnswer(item, { subject: 'he', verb: 'works', wh: 'place' })).toEqual([true, true, true])
    expect(checkAnswer(item, { subject: 'It', verb: 'works', wh: 'place' })[0]).toBe(false)
  })
  it('la solución proyectada, el resumen del celular y el reporte lo muestran', () => {
    const item = q(['Alex', 'She'])
    expect(subjectAccept(item)).toEqual(['Alex', 'She', 'He'])
    expect(solutionOf(item).subject).toEqual(['Alex', 'She', 'He'])
    expect(reviewQuestion(item).subject.accept).toEqual(['Alex', 'She', 'He'])
  })
  it('un nombre que no es unisex queda como está', () => {
    expect(subjectAccept(q(['Tom', 'He']))).toEqual(['Tom', 'He'])
    expect(checkAnswer(q(['Tom', 'He']), { subject: 'She', verb: 'works', wh: 'place' })[0]).toBe(false)
  })
  it('un sujeto plural con un nombre unisex no gana pronombres', () => {
    expect(subjectAccept(q(['Sam and Ana', 'They']))).toEqual(['Sam and Ana', 'They'])
  })
})

describe('mezclar preguntas', () => {
  it('sin mezclar no hay orden; mezcladas, cada pregunta sale una vez', () => {
    expect(playOrder(10, false)).toBe(null)
    const order = playOrder(10, true)
    expect([...order].sort((a, b) => a - b)).toEqual([...Array(10).keys()])
  })
  it('las preguntas se juegan en el orden sorteado; un orden que no calza se ignora', () => {
    const qs = ['a', 'b', 'c']
    expect(playedQuestions(qs, [2, 0, 1])).toEqual(['c', 'a', 'b'])
    expect(playedQuestions(qs, { 0: 1, 1: 2, 2: 0 })).toEqual(['b', 'c', 'a']) // Firebase puede devolver objeto
    expect(playedQuestions(qs, null)).toBe(qs)
    expect(playedQuestions(qs, [1, 0])).toBe(qs) // la actividad cambió de largo
  })
})

describe('Picture Practice', () => {
  it('cada pregunta trae su imagen, y la imagen existe en public/', async () => {
    const { existsSync } = await import('node:fs')
    const sets = SETS.filter((s) => s.type === 'picture-practice')
    expect(sets.length).toBeGreaterThan(0)
    for (const s of sets) {
      for (const q of s.questions) {
        expect(q.image).toMatch(/^images\//)
        expect(existsSync(`public/${q.image}`), q.image).toBe(true)
      }
    }
  })
})

describe('imagen en el celular', () => {
  const base = { prompt: 'Q?', answer: 'a', options: ['a', 'b', 'c'] }
  it('viaja el enlace de las imágenes de la app; las fotos subidas, solo el aviso', () => {
    expect(buildPublicQuestion({ ...base, image: 'images/ps-vs-pc/1.jpg' })).toMatchObject({ hasImage: true, image: 'images/ps-vs-pc/1.jpg' })
    const uploaded = buildPublicQuestion({ ...base, image: 'data:image/jpeg;base64,AAAA' })
    expect(uploaded.hasImage).toBe(true)
    expect(uploaded.image).toBeUndefined()
    expect(buildPublicQuestion(base).hasImage).toBeUndefined()
  })
})
