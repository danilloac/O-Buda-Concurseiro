import { describe, expect, it } from 'vitest'
import { EDITAL } from '../dados/edital'
import { estadoInicial } from '../dados/inicial'
import { comparacao, contar, marcarItem, noRecorte, porMateria, proximoStatus, pctVisto } from './edital'

describe('Edital verticalizado', () => {
  it('bate com a planilha: 239 itens, 151 comuns', () => {
    expect(EDITAL).toHaveLength(239)
    expect(comparacao(EDITAL)).toEqual({ ambos: 151, so8: 53, so4: 35 })
    expect(noRecorte(EDITAL, 'trt8')).toHaveLength(204)
    expect(noRecorte(EDITAL, 'trt4')).toHaveLength(186)
  })

  it('toda matéria do edital existe no app', () => {
    const ids = new Set(estadoInicial().materias.map((m) => m.id))
    expect(EDITAL.filter((i) => !ids.has(i.materiaId))).toEqual([])
  })

  it('marca, conta e agrupa', () => {
    let e = estadoInicial()
    e = marcarItem(e, 1, 'Teoria')
    e = marcarItem(e, 2, proximoStatus(proximoStatus('Teoria')))
    expect(e.edital).toEqual({ 1: 'Teoria', 2: 'Revisado' })
    const c = contar(EDITAL, e.edital)
    expect(c.Teoria).toBe(1)
    expect(pctVisto(c)).toBeCloseTo(2 / 239)
    e = marcarItem(e, 1, 'Não visto')
    expect(e.edital).toEqual({ 2: 'Revisado' })
    const g = porMateria(EDITAL, e.edital, e.log)
    expect(g[0].materiaId).toBe('portugues')
    expect(g[0].questoes).toBeGreaterThan(0)
    expect(proximoStatus('Revisado')).toBe('Não visto')
  })
})
