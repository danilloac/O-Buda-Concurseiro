import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import { migrar } from '../dados/migracao'
import {
  daSemana,
  desde,
  doDia,
  editar,
  faixaAcerto,
  porDia,
  registrar,
  remover,
  semanaDe,
  topicosDaMateria,
  totais,
  validar,
  type Rascunho,
} from './log'

const base: Rascunho = {
  data: '2026-11-27',
  materiaId: 'banco-dados',
  topico: ' Oracle ',
  resolvidas: 6,
  acertos: 4,
  obs: '',
}

describe('Log copiado da planilha', () => {
  const { log, giro } = estadoInicial()

  it('bate com a Visão Geral: 979 questões e 67% de acerto', () => {
    const t = totais(log)
    expect(log).toHaveLength(369)
    expect(t.resolvidas).toBe(979)
    expect(t.acertos).toBe(660)
    expect(Math.round(t.pct! * 100)).toBe(67)
  })

  it('bate com o Diário: 154 questões desde o início do giro', () => {
    expect(totais(desde(log, giro.inicio)).resolvidas).toBe(154)
  })

  it('soma o dia e a semana', () => {
    expect(totais(doDia(log, '2026-11-26')).resolvidas).toBe(totais(daSemana(log, '2026-11-26')).resolvidas)
    expect(doDia(log, '2026-11-25')).toHaveLength(0)
  })

  it('sugere tópicos já usados na matéria, sem repetir', () => {
    const t = topicosDaMateria(log, 'banco-dados')
    expect(t).toContain('Oracle')
    expect(new Set(t).size).toBe(t.length)
    expect(t).not.toContain('')
  })
})

describe('regras do Log', () => {
  it('semana começa na segunda', () => {
    expect(semanaDe('2026-10-21')).toBe('2026-10-19') // quarta
    expect(semanaDe('2026-10-19')).toBe('2026-10-19') // segunda
    expect(semanaDe('2026-10-25')).toBe('2026-10-19') // domingo
  })

  it('valida o formulário', () => {
    expect(validar(base)).toBeNull()
    expect(validar({ ...base, resolvidas: 0 })).toMatch(/Resolvidas/)
    expect(validar({ ...base, acertos: 7 })).toMatch(/passar/)
    expect(validar({ ...base, materiaId: '' })).toMatch(/matéria/)
  })

  it('registra, edita e remove', () => {
    let e = registrar(estadoInicial(), base)
    const nova = e.log[e.log.length - 1]
    expect(nova).toMatchObject({ topico: 'Oracle', resolvidas: 6, acertos: 4 })
    e = editar(e, nova.id, { ...base, acertos: 5 })
    expect(e.log.find((l) => l.id === nova.id)?.acertos).toBe(5)
    e = remover(e, nova.id)
    expect(e.log).toHaveLength(369)
  })

  it('agrupa por dia, mais recente primeiro', () => {
    const dias = porDia(estadoInicial().log)
    expect(dias[0].data).toBe('2026-11-26')
    expect(dias.at(-1)?.data).toBe('2026-10-21')
  })

  it('faixa de acerto em relação à meta', () => {
    expect(faixaAcerto(0.8, 0.8)).toBe('bom')
    expect(faixaAcerto(0.65, 0.8)).toBe('medio')
    expect(faixaAcerto(0.5, 0.8)).toBe('fraco')
  })

  it('migra um estado salvo sem Log', () => {
    const { log: _sem, ...v1 } = { ...estadoInicial(), versao: 1 }
    const e = migrar(v1)
    expect(e.versao).toBe(4)
    expect(e.edital).toEqual({})
    expect(e.materias.some((m) => m.id === 'redacao')).toBe(true)
    expect(e.errosTec.materias).toHaveLength(9)
    expect(e.log).toHaveLength(369)
  })
})
