import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import { totais } from './log'
import { aplicarLeituraTec, validarLeituraTec, type LeituraTec } from './tec'

const leitura: LeituraTec = {
  lote: '2026-11-27T21:00',
  leitura: '2026-11-27',
  questoes: [
    ['Banco de Dados', 'Oracle', 6, 4],
    { materia: 'redes', topico: ' Máscara e Endereçamento IP ', resolvidas: 3, acertos: 3, data: '2026-11-26' },
  ],
  erros: {
    linhas: [
      ['Banco de Dados', 'PostgreSQL', 8, 4, 3, 2],
      ['Banco de Dados', 'Oracle', 7, 7, 0, 0],
      ['Arquivologia', 'Protocolo', 2, 1, 1, 0],
    ],
  },
}

describe('Leitura do Tec no app', () => {
  it('lança as questões no Log e troca o caderno de erros', () => {
    const { estado: e, resumo } = aplicarLeituraTec(estadoInicial(), leitura)
    expect(resumo).toMatchObject({ ok: true, questoes: 2, resolvidas: 9, acertos: 7, topicosErros: 3, materiasNovas: ['Arquivologia'] })
    expect(totais(e.log).resolvidas).toBe(979 + 9)
    expect(e.log.at(-1)).toMatchObject({ materiaId: 'redes', topico: 'Máscara e Endereçamento IP', data: '2026-11-26', obs: 'Tec' })
    expect(e.log.at(-2)).toMatchObject({ materiaId: 'banco-dados', data: '2026-11-27' })
    expect(e.errosTec.leitura).toBe('2026-11-27')
    const bd = e.errosTec.materias.find((m) => m.materiaId === 'banco-dados')!
    expect(bd).toMatchObject({ noCaderno: 15, recorrentes: 2, pctProva: 0.1 })
    expect(bd.acertoRefazer).toBeCloseTo(11 / 14)
    expect(e.errosTec.topicos.find((t) => t.topico === 'PostgreSQL')!.incidencia).toBe('Alta')
    expect(e.materias.find((m) => m.nome === 'Arquivologia')).toMatchObject({ entraNoGiro: false })
  })

  it('o mesmo lote não entra duas vezes', () => {
    const uma = aplicarLeituraTec(estadoInicial(), leitura).estado
    const duas = aplicarLeituraTec(uma, leitura)
    expect(duas.resumo).toMatchObject({ ok: true, repetido: true, questoes: 0 })
    expect(duas.estado.log).toHaveLength(uma.log.length)
  })

  it('erros em partes: a segunda parte acrescenta', () => {
    let e = aplicarLeituraTec(estadoInicial(), { lote: 'x#1', leitura: '2026-11-27', erros: { linhas: [['Redes', 'IP', 3, 1, 2, 1]] } }).estado
    e = aplicarLeituraTec(e, { lote: 'x#2', leitura: '2026-11-27', erros: { linhas: [['Redes', 'DNS', 2, 2, 0, 0]], substituir: false } }).estado
    expect(e.errosTec.topicos).toHaveLength(2)
    expect(e.errosTec.materias).toEqual([{ materiaId: 'redes', noCaderno: 5, pctProva: 0.16, recorrentes: 1, acertoRefazer: 0.6 }])
  })

  it('recusa formato errado sem mexer no estado', () => {
    expect(validarLeituraTec({ lote: 'a', leitura: '27/11/2026' })).toMatch(/AAAA-MM-DD/)
    expect(validarLeituraTec({ lote: 'a', leitura: '2026-11-27', questoes: [['Redes', 'IP', 3, 5]] })).toMatch(/inválidos/)
    const r = aplicarLeituraTec(estadoInicial(), { lote: 'a', leitura: '2026-11-27', erros: { linhas: [['Redes', 'IP', 1]] } } as unknown as LeituraTec)
    expect(r.resumo.ok).toBe(false)
    expect(r.estado).toEqual(estadoInicial())
  })
})
