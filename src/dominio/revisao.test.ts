import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import {
  adicionarNaRevisao,
  desempenhoNoLog,
  estaNaRevisao,
  mudarStatus,
  removerDaRevisao,
  sugestoesDeRevisao,
} from './revisao'

describe('fila de revisão', () => {
  it('calcula o % acumulado do tópico a partir do Log', () => {
    const e = estadoInicial()
    const d = desempenhoNoLog(e.log, 'sistemas-op', 'Unix e Linux')
    expect(d.resolvidas).toBe(10)
    expect(d.pct).toBeCloseTo(0.4) // a planilha mostra 40%
    expect(d.ultimo).toBe('2026-11-16') // e último registro 16/11
  })

  it('compreendido sai da fila e guarda a data e o giro', () => {
    let e = estadoInicial()
    const id = e.revisao[0].id
    e = mudarStatus(e, id, 'Compreendido', '2026-11-27')
    const t = e.revisao.find((x) => x.id === id)!
    expect(t).toMatchObject({ status: 'Compreendido', concluidoEm: '2026-11-27', concluidoNoGiro: 6 })
    expect(estaNaRevisao(e.revisao, t.materia, t.topico)).toBe(false)
  })

  it('não duplica e reabre um tópico compreendido', () => {
    let e = estadoInicial()
    const n = e.revisao.length
    e = adicionarNaRevisao(e, { materia: 'Redes', topico: 'Máscara e Endereçamento IP' })
    expect(e.revisao).toHaveLength(n)
    const id = e.revisao[0].id
    e = mudarStatus(e, id, 'Compreendido', '2026-11-27')
    e = adicionarNaRevisao(e, { materia: e.revisao[0].materia, topico: e.revisao[0].topico }, '2026-12-10')
    expect(e.revisao).toHaveLength(n)
    expect(e.revisao[0]).toMatchObject({ status: 'Não compreendido', entrouEm: '2026-12-10' })
    e = removerDaRevisao(e, id)
    expect(e.revisao).toHaveLength(n - 1)
  })

  it('sugere tópicos que batem os critérios e não estão na fila', () => {
    const e = estadoInicial()
    const s = sugestoesDeRevisao(e)
    expect(s.length).toBeGreaterThan(0)
    for (const x of s) {
      expect(x.resolvidas >= 10 ? x.pct < 0.7 : x.pct < 0.4).toBe(true)
      expect(estaNaRevisao(e.revisao, x.materia, x.topico)).toBe(false)
    }
  })

  it('compreendido só volta a ser sugerido depois de 2 giros', () => {
    let e = estadoInicial()
    // Unix e Linux: 40% com 10 questões, bate o critério
    const id = e.revisao.find((t) => t.topico === 'Unix e Linux')!.id
    e = mudarStatus(e, id, 'Compreendido', '2026-11-27')
    expect(sugestoesDeRevisao(e).some((x) => x.topico === 'Unix e Linux')).toBe(false)
    e = { ...e, giro: { ...e.giro, numero: e.giro.numero + 2 } }
    expect(sugestoesDeRevisao(e).some((x) => x.topico === 'Unix e Linux')).toBe(true)
  })
})
