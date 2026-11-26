import { describe, expect, it } from 'vitest'
import { estadoInicial } from '../dados/inicial'
import {
  alterarLembrete,
  alterarMateria,
  alterarParametros,
  idDoNome,
  novaMateria,
  novoLembrete,
  removerLembrete,
  removerProva,
  salvarProva,
  novoConcurso,
  validarMetas,
} from './config'
import { metasDaMateria, resumoDoGiro } from './giro'

describe('Configuração', () => {
  it('muda parâmetros e as metas acompanham o nível', () => {
    const e = alterarParametros(estadoInicial(), { nivel: 'Iniciante' })
    const dev = e.materias.find((m) => m.id === 'dev-sistemas')!
    expect(metasDaMateria(dev, e.parametros).ideal).toBe(27) // 21 × 1,3 = 27,3 → bloco de 3
  })

  it('tirar e pôr matéria no giro ajusta a ordem', () => {
    let e = alterarMateria(estadoInicial(), 'rlm', { entraNoGiro: false })
    expect(e.giro.ordem).not.toContain('rlm')
    expect(resumoDoGiro(e).totalMaterias).toBe(10)
    e = alterarMateria(e, 'rlm', { entraNoGiro: true, ideal: 9 })
    expect(e.giro.ordem.at(-1)).toBe('rlm')
    expect(e.materias.find((m) => m.id === 'rlm')!.ideal).toBe(9)
  })

  it('cria matéria com id único', () => {
    expect(idDoNome('Português', ['portugues'])).toBe('portugues-2')
    const e = novaMateria(estadoInicial(), 'Arquivologia')
    expect(e.materias.at(-1)).toMatchObject({ id: 'arquivologia', entraNoGiro: true })
    expect(e.giro.ordem.at(-1)).toBe('arquivologia')
    expect(novaMateria(e, '  ')).toBe(e)
  })

  it('valida metas', () => {
    expect(validarMetas({ minimo: 9, ideal: 15, maximo: 21, caudaNoIdeal: 3 })).toBeNull()
    expect(validarMetas({ minimo: 18, ideal: 15, maximo: 21, caudaNoIdeal: 0 })).toMatch(/mínimo/)
    expect(validarMetas({ minimo: 9, ideal: 15, maximo: 12, caudaNoIdeal: 0 })).toMatch(/máximo/)
  })

  it('provas ficam em ordem de data', () => {
    let e = salvarProva(estadoInicial(), { nome: 'TRF 1', banca: 'FGV', data: '2027-01-20' })
    expect(e.provas.map((p) => p.id)).toEqual(['trt8', 'trf-1', 'tjpb', 'trt4'])
    e = salvarProva(e, { id: 'trf-1', nome: 'TRF 1', banca: 'FGV', data: '2027-03-01' })
    expect(e.provas.at(-1)!.id).toBe('trf-1')
    expect(removerProva(e, 'trf-1').provas).toHaveLength(3)
  })

  it('lembretes', () => {
    let e = novoLembrete(estadoInicial(), 'Simulado', 'Domingo')
    const id = e.lembretes.at(-1)!.id
    e = alterarLembrete(e, id, { nota: 'Sábado' })
    expect(e.lembretes.at(-1)).toMatchObject({ nome: 'Simulado', nota: 'Sábado', feito: false })
    expect(removerLembrete(e, id).lembretes).toHaveLength(estadoInicial().lembretes.length)
  })
})

describe('Começar novo concurso', () => {
  const padrao = estadoInicial().parametros
  it('zera tudo e mantém o que foi pedido', () => {
    const e = novoConcurso(estadoInicial(), { nome: 'TRF 1', manterMaterias: true, manterParametros: true, manterProvas: false }, '2026-12-01', padrao)
    expect(e).toMatchObject({ log: [], revisao: [], historico: [], provas: [], edital: {}, horasHoje: null })
    expect(e.giro).toMatchObject({ numero: 1, inicio: '2026-12-01', marcacoes: {} })
    expect(e.giro.ordem).toHaveLength(11)
    expect(e.parametros.concurso).toBe('TRF 1')
    expect(e.errosTec.materias).toHaveLength(0)
    expect(e.lembretes.every((l) => !l.feito)).toBe(true)
  })

  it('pode começar sem matérias', () => {
    const e = novoConcurso(estadoInicial(), { nome: '', manterMaterias: false, manterParametros: false, manterProvas: true }, '2026-12-01', padrao)
    expect(e.materias).toHaveLength(0)
    expect(e.giro.ordem).toHaveLength(0)
    expect(e.provas).toHaveLength(3)
    expect(e.parametros.concurso).toBe(padrao.concurso)
  })
})
