import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import { raioX } from './raiox'
import type { LogQuestao } from './tipos'

const l = (data: string, topico: string, resolvidas: number, acertos: number): LogQuestao => ({
  id: `${data}${topico}`,
  data,
  materiaId: 'redes',
  topico,
  resolvidas,
  acertos,
  obs: '',
})

describe('Raio-X', () => {
  it('agrupa por matéria e tópico, do mais fraco para o mais forte', () => {
    const r = raioX(estadoInicial().log, { materiaId: '', minimo: 5 })
    for (let i = 1; i < r.length; i++) expect(r[i].pct).toBeGreaterThanOrEqual(r[i - 1].pct)
    expect(r.every((x) => x.resolvidas >= 5)).toBe(true)
    // Máscara e Endereçamento IP: 5 + 1 + 3 + ... registros somados num só tópico
    expect(r.filter((x) => x.topico === 'Máscara e Endereçamento IP')).toHaveLength(1)
  })

  it('filtra por matéria', () => {
    const r = raioX(estadoInicial().log, { materiaId: 'banco-dados', minimo: 1 })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((x) => x.materiaId === 'banco-dados')).toBe(true)
  })

  it('compara a última semana do Log com a anterior', () => {
    const log = [
      l('2026-11-10', 'DHCP', 4, 1), // semana de 09/11
      l('2026-11-17', 'DHCP', 5, 4), // semana de 16/11 (a mais recente)
      l('2026-11-17', 'HTTP', 2, 2),
    ]
    const [dhcp] = raioX(log, { materiaId: '', minimo: 1 })
    expect(dhcp.topico).toBe('DHCP')
    expect(dhcp.ultimaSemana).toEqual({ resolvidas: 5, pct: 0.8 })
    expect(dhcp.semanaAnterior).toEqual({ resolvidas: 4, pct: 0.25 })
    expect(dhcp.variacao).toBeCloseTo(0.55)
    const http = raioX(log, { materiaId: '', minimo: 1 }).find((x) => x.topico === 'HTTP')!
    expect(http.variacao).toBeNull()
  })
})
