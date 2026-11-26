import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import { porMateria, porSemana, resumoGeral, semanasDoLog } from './painel'

describe('painel com o Log da planilha', () => {
  const estado = estadoInicial()

  it('lista as semanas de 19/10 a 23/11', () => {
    expect(semanasDoLog(estado.log)).toEqual([
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
    ])
  })

  it('soma por semana sem perder questões', () => {
    const semanas = porSemana(estado.log)
    expect(semanas.reduce((s, x) => s + x.resolvidas, 0)).toBe(979)
    expect(semanas[0]).toMatchObject({ semana: '2026-10-19', resolvidas: 69, acertos: 44 })
  })

  it('soma por matéria e alinha a evolução às semanas', () => {
    const linhas = porMateria(estado)
    expect(linhas.reduce((s, x) => s + x.resolvidas, 0)).toBe(979)
    expect(linhas).toHaveLength(11)
    for (const l of linhas) expect(l.semanas).toHaveLength(6)
    expect(linhas[0].resolvidas).toBeGreaterThanOrEqual(linhas[1].resolvidas)
  })

  it('resume como a Visão Geral', () => {
    const r = resumoGeral(estado)
    expect(r.resolvidas).toBe(979)
    expect(Math.round(r.pct! * 100)).toBe(67)
    expect(r.girosCompletos).toBe(5)
    expect(r.diasEstudados).toBe(24)
  })

  it('funciona com o Log vazio', () => {
    const vazio = { ...estado, log: [] }
    expect(porSemana(vazio.log)).toEqual([])
    expect(porMateria(vazio)).toEqual([])
    expect(resumoGeral(vazio).pct).toBeNull()
  })
})
