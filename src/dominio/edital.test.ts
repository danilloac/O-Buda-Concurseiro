import { describe, expect, it } from 'vitest'
import { EDITAL } from '../dados/edital'
import { estadoInicial } from '../dados/inicial'
import {
  aplicarEdital,
  comparacao,
  concursosDoEdital,
  contar,
  lerEdital,
  nomeDeMateria,
  marcarItem,
  noRecorte,
  pctVisto,
  porMateria,
  proximoStatus,
  resumoDaLeitura,
  sugestoesDeTopico,
} from './edital'

describe('Edital verticalizado', () => {
  it('bate com a planilha: 239 itens, 151 comuns', () => {
    expect(EDITAL).toHaveLength(239)
    expect(comparacao(EDITAL)).toEqual({ comuns: 151, porConcurso: { 'TRT 8': 53, 'TRT 4': 35 } })
    expect(concursosDoEdital(EDITAL)).toEqual(['TRT 8', 'TRT 4'])
    expect(noRecorte(EDITAL, 'TRT 8')).toHaveLength(204)
    expect(noRecorte(EDITAL, 'TRT 4')).toHaveLength(186)
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
  })

  it('sugere tópicos do Log e depois os do edital', () => {
    const s = sugestoesDeTopico(estadoInicial(), 'portugues')
    expect(s).toContain('Pontuação')
    expect(new Set(s).size).toBe(s.length)
  })
})

describe('Importar edital', () => {
  it('lê texto com cabeçalhos e itens numerados na mesma linha', () => {
    const l = lerEdital(`EDITAL Nº 1
LÍNGUA PORTUGUESA: 1 Compreensão de textos. 2 Ortografia oficial. 3 Emprego da crase.
# Arquivologia
- Conceitos fundamentais
1.2 Gestão de documentos;
Noções de Informática:
a) Windows 10`)
    expect(l.itens.map((i) => [i.materia, i.item])).toEqual([
      ['Língua Portuguesa', 'Compreensão de textos'],
      ['Língua Portuguesa', 'Ortografia oficial'],
      ['Língua Portuguesa', 'Emprego da crase'],
      ['Arquivologia', 'Conceitos fundamentais'],
      ['Arquivologia', 'Gestão de documentos'],
      ['Noções de Informática', 'Windows 10'],
    ])
    expect(l.avisos[0]).toMatch(/1 linha antes/)
    expect(nomeDeMateria('NOÇÕES DE DIREITO ADMINISTRATIVO')).toBe('Noções de Direito Administrativo')
    expect(nomeDeMateria('GOVERNANÇA DE TI')).toBe('Governança de TI')
    expect(nomeDeMateria('Dev. Sistemas')).toBe('Dev. Sistemas')
  })

  it('lê tabela colada da planilha, com concurso', () => {
    const l = lerEdital('Matéria\tItem\tConcurso\nPortuguês\tCrase\tAmbos\nArquivologia\tProtocolo\tSó TRF 1\nArquivologia\t\t')
    expect(l.itens).toEqual([
      { materia: 'Português', item: 'Crase', edital: 'Ambos' },
      { materia: 'Arquivologia', item: 'Protocolo', edital: 'Só TRF 1' },
    ])
    expect(l.avisos).toHaveLength(1)
    expect(resumoDaLeitura(estadoInicial().materias, l.itens)).toEqual({
      materias: [
        { nome: 'Português', itens: 1, nova: false },
        { nome: 'Arquivologia', itens: 1, nova: true },
      ],
      concursos: ['TRF 1'],
    })
  })

  it('substitui o edital e cria as matérias novas', () => {
    const { itens } = lerEdital('# português\nCrase\n# Arquivologia\nProtocolo\nArquivo')
    let e = marcarItem(estadoInicial(), 1, 'Teoria')
    e = aplicarEdital(e, itens, { substituir: true, novasNoGiro: true })
    expect(e.editalItens.map((i) => [i.n, i.materiaId, i.item])).toEqual([
      [1, 'portugues', 'Crase'],
      [2, 'arquivologia', 'Protocolo'],
      [3, 'arquivologia', 'Arquivo'],
    ])
    expect(e.edital).toEqual({})
    expect(e.giro.ordem.at(-1)).toBe('arquivologia')
    const mais = aplicarEdital(e, [{ materia: 'Arquivologia', item: 'Temporalidade', edital: '' }], { substituir: false, novasNoGiro: false })
    expect(mais.editalItens.at(-1)).toMatchObject({ n: 4, materiaId: 'arquivologia' })
    expect(mais.materias).toHaveLength(e.materias.length)
  })
})
