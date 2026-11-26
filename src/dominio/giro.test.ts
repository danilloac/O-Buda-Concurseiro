import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import {
  alternarBloco,
  faixaDoBloco,
  fecharGiro,
  linhasDoGiro,
  materiaDaRevisao,
  metasDaMateria,
  planoDoDia,
  resumoDoGiro,
  semanasPorGiro,
  statusDaMateria,
} from './giro'
import { contagemRegressiva } from './datas'

// Os valores esperados são os que a planilha mostra no Diário em 26/11/2026.

describe('giro com os dados da planilha', () => {
  const estado = estadoInicial()
  const linhas = linhasDoGiro(estado)
  const porNome = Object.fromEntries(linhas.map((l) => [l.materia.nome, l]))

  it('calcula blocos e questões feitas', () => {
    expect(porNome['Português'].marcacao.blocos).toHaveLength(7)
    expect(porNome['Dev. Sistemas'].marcacao.blocos).toHaveLength(10)
    expect(porNome['Redes'].feitas).toBe(15)
    expect(porNome['Sistemas Operacionais'].feitas).toBe(6)
  })

  it('dá o mesmo status da coluna Status', () => {
    expect(porNome['Português'].status).toBe('maximo')
    expect(porNome['Redes'].status).toBe('ideal')
    expect(porNome['Sistemas Operacionais'].status).toBe('minimo')
    expect(porNome['Ciência de Dados & IA'].status).toBe('ideal')
    expect(porNome['Banco de Dados'].status).toBe('a-fazer')
  })

  it('aponta a matéria da revisão 5 posições antes', () => {
    expect(porNome['Português'].revisarMateria?.nome).toBe('RLM')
    expect(porNome['Engenharia de Software'].revisarMateria?.nome).toBe('Sistemas Operacionais')
    expect(porNome['Segurança da Informação'].revisarMateria?.nome).toBe('Inglês Técnico')
    expect(materiaDaRevisao(['a', 'b', 'c'], 0, 5)).toBe('b')
  })

  it('resume o giro como o bloco "Giro"', () => {
    const r = resumoDoGiro(estado)
    expect(r.concluidas).toBe(9)
    expect(r.totalMaterias).toBe(11)
    expect(r.proxima?.nome).toBe('Banco de Dados')
    expect(r.feitas).toBe(141)
    expect(r.meta).toBe(144)
    expect(r.comErros).toBe(7)
    expect(r.comRevisao).toBe(11)
    expect(r.podeFechar).toBe(false)
  })

  it('programa o dia com 3 horas', () => {
    const p = planoDoDia(estado, 3)
    expect(p.revisoes).toBe(2)
    expect(p.minutosRevisao).toBe(60)
    expect(p.ineditas).toBe(15)
    expect(p.blocos).toBe(5)
    expect(p.erros).toBe(10)
    expect(p.comecarPor?.nome).toBe('Banco de Dados')
    expect(p.topicos.map((t) => t.topico)).toEqual([
      'Unix e Linux',
      'Windows Powershell e Prompt de Comando',
    ])
  })

  it('estima ≈ 1,4 semanas por giro', () => {
    expect(semanasPorGiro(estado)).toBeCloseTo(1.4, 1)
  })
})

describe('regras isoladas', () => {
  const metas = { minimo: 9, ideal: 15, maximo: 21, cauda: 3 }

  it('status por faixa', () => {
    expect(statusDaMateria(0, metas)).toBe('a-fazer')
    expect(statusDaMateria(6, metas)).toBe('andamento')
    expect(statusDaMateria(9, metas)).toBe('minimo')
    expect(statusDaMateria(15, metas)).toBe('ideal')
    expect(statusDaMateria(21, metas)).toBe('maximo')
  })

  it('cor de cada bloco', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => faixaDoBloco(i, metas, 3))).toEqual([
      'minimo', 'minimo', 'minimo', 'ideal', 'cauda', 'extra', 'extra',
    ])
  })

  it('nível Iniciante aumenta metas em blocos inteiros', () => {
    const e = estadoInicial()
    e.parametros.nivel = 'Iniciante'
    const bd = e.materias.find((x) => x.id === 'banco-dados')!
    expect(metasDaMateria(bd, e.parametros)).toEqual({ minimo: 12, ideal: 21, maximo: 27, cauda: 3 })
  })

  it('marcar um bloco marca os anteriores', () => {
    const e = alternarBloco(estadoInicial(), 'banco-dados', 2)
    expect(e.giro.marcacoes['banco-dados'].blocos.slice(0, 4)).toEqual([true, true, true, false])
    const d = alternarBloco(e, 'banco-dados', 1)
    expect(d.giro.marcacoes['banco-dados'].blocos.slice(0, 3)).toEqual([true, false, false])
  })

  it('fechar o giro grava o histórico e zera as marcações', () => {
    const e = fecharGiro(estadoInicial(), '2026-11-28')
    expect(e.giro.numero).toBe(7)
    expect(e.giro.inicio).toBe('2026-11-28')
    expect(e.historico.at(-1)).toMatchObject({ numero: 6, feitas: 141, meta: 144 })
    expect(resumoDoGiro(e).feitas).toBe(0)
  })

  it('contagem regressiva', () => {
    expect(contagemRegressiva('2027-01-17', '2026-11-26')).toMatchObject({ dias: 52, texto: '7 sem + 3 d' })
    expect(contagemRegressiva('2026-11-26', '2026-11-26').texto).toBe('É hoje!')
  })
})
