import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import { fecharGiro, resumoDoGiro } from './giro'
import { totais } from './log'
import { duracaoMedia, linhasDoHistorico } from './historico'

describe('Histórico dos giros', () => {
  const e = estadoInicial()
  const r = resumoDoGiro(e)
  const linhas = linhasDoHistorico(e, '2026-11-26', r.concluidas, r.totalMaterias)

  it('traz os 5 giros da planilha e o giro 6 em andamento', () => {
    expect(linhas.map((l) => l.numero)).toEqual([1, 2, 3, 4, 5, 6])
    expect(linhas[2]).toMatchObject({ dias: 12, concluidas: 11, erros: '9 dias', revisao: '11 dias' })
    expect(linhas[0].dias).toBeNull()
    expect(linhas[5]).toMatchObject({ emAndamento: true, questoes: 154, concluidas: 9, totalMaterias: 11 })
  })

  it('cada questão do Log cai em um só giro', () => {
    expect(linhas.reduce((s, l) => s + l.questoes, 0)).toBe(totais(e.log).resolvidas)
  })

  it('duração média dos giros fechados com início conhecido', () => {
    expect(duracaoMedia(linhas)).toBeCloseTo((7 + 12 + 6 + 8) / 4)
  })

  it('fechar o giro guarda as matérias concluídas', () => {
    const f = fecharGiro(e, '2026-11-26')
    expect(f.historico.at(-1)).toMatchObject({ numero: 6, concluidas: 9, totalMaterias: 11, feitas: 141 })
    expect(f.giro.numero).toBe(7)
  })
})
