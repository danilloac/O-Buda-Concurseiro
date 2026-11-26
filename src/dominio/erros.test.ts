import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import { errosPorMateria, errosPorTopico, situacaoDoTopico } from './erros'

describe('caderno de erros', () => {
  const e = estadoInicial()

  it('calcula Erra × peso como a planilha', () => {
    const m = Object.fromEntries(errosPorMateria(e.errosTec).map((x) => [x.materiaId, x]))
    expect(e.errosTec.materias.reduce((s, x) => s + x.noCaderno, 0)).toBe(344)
    expect(m['sistemas-op'].erraPeso).toBeCloseTo(2.03, 2)
    expect(m['sistemas-op'].leitura).toBe('mais')
    expect(m['dev-sistemas'].leitura).toBe('proporcional')
    expect(m['redes'].leitura).toBe('pouco') // 0,7x
    expect(m['governanca'].leitura).toBe('pouco')
    expect(m['portugues'].leitura).toBe('sem-peso')
  })

  it('classifica a situação dos tópicos', () => {
    expect(situacaoDoTopico({ recorrentes: 0, incidencia: 'Baixa' }, 0.2)).toBe('baixa')
    expect(situacaoDoTopico({ recorrentes: 1, incidencia: 'Alta' }, 0.9)).toBe('cronico')
    expect(situacaoDoTopico({ recorrentes: 0, incidencia: 'Alta' }, 0.71)).toBe('fraco')
    expect(situacaoDoTopico({ recorrentes: 0, incidencia: 'Moderada' }, 0.75)).toBe('ok')
    expect(situacaoDoTopico({ recorrentes: 0, incidencia: '' }, null)).toBe('ok')
  })

  it('bate com a coluna Situação para os tópicos da planilha', () => {
    const t = Object.fromEntries(errosPorTopico(e.errosTec, e.log).map((x) => [x.topico, x]))
    expect(t['PostgreSQL'].situacao).toBe('cronico')
    expect(t['Oracle'].situacao).toBe('fraco')
    expect(t['ITIL v4'].situacao).toBe('ok')
    expect(t['Cloud Computing (Computação em Nuvem)'].situacao).toBe('ok')
    expect(t['Diagrama de Redes, PERT, CPM e MDP'].situacao).toBe('fraco')
    expect(t['Versionamento e Migração de Banco de Dados'].situacao).toBe('baixa')
    expect(t['Padrões de Projeto (Engenharia de Software)'].acertoRefazer).toBeCloseTo(2 / 6)
  })
})
