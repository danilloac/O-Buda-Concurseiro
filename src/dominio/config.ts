import type { EstadoApp, Lembrete, Materia, Parametros, Prova } from './tipos'

export function alterarParametros(e: EstadoApp, patch: Partial<Parametros>): EstadoApp {
  return { ...e, parametros: { ...e.parametros, ...patch } }
}

/** Gera um id curto a partir do nome, sem repetir os existentes. */
export function idDoNome(nome: string, existentes: string[]): string {
  const base =
    nome
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30) || 'item'
  let id = base
  for (let i = 2; existentes.includes(id); i++) id = `${base}-${i}`
  return id
}

/** Muda uma matéria. Entrar ou sair do giro também ajusta a ordem do ciclo. */
export function alterarMateria(e: EstadoApp, id: string, patch: Partial<Omit<Materia, 'id'>>): EstadoApp {
  const materias = e.materias.map((m) => (m.id === id ? { ...m, ...patch } : m))
  let ordem = e.giro.ordem
  if (patch.entraNoGiro === true && !ordem.includes(id)) ordem = [...ordem, id]
  if (patch.entraNoGiro === false) ordem = ordem.filter((x) => x !== id)
  return { ...e, materias, giro: { ...e.giro, ordem } }
}

export function novaMateria(e: EstadoApp, nome: string): EstadoApp {
  const limpo = nome.trim()
  if (!limpo) return e
  const id = idDoNome(limpo, e.materias.map((m) => m.id))
  const m: Materia = {
    id,
    nome: limpo,
    entraNoGiro: true,
    nivel: 'Dificuldade',
    minimo: 6,
    ideal: 9,
    maximo: 15,
    caudaNoIdeal: 0,
    extraVaiPara: 'Núcleo',
  }
  return { ...e, materias: [...e.materias, m], giro: { ...e.giro, ordem: [...e.giro.ordem, id] } }
}

/** Mínimo ≤ ideal ≤ máximo e cauda dentro do ideal. Devolve a mensagem do primeiro problema. */
export function validarMetas(m: Pick<Materia, 'minimo' | 'ideal' | 'maximo' | 'caudaNoIdeal'>): string | null {
  if ([m.minimo, m.ideal, m.maximo, m.caudaNoIdeal].some((v) => v < 0)) return 'Use números a partir de zero.'
  if (m.minimo > m.ideal) return 'O mínimo passa do ideal.'
  if (m.ideal > m.maximo) return 'O ideal passa do máximo.'
  if (m.caudaNoIdeal > m.ideal) return 'A cauda passa do ideal.'
  return null
}

export function salvarProva(e: EstadoApp, p: Omit<Prova, 'id'> & { id?: string }): EstadoApp {
  const id = p.id ?? idDoNome(p.nome, e.provas.map((x) => x.id))
  const prova: Prova = { id, nome: p.nome.trim(), banca: p.banca.trim(), data: p.data }
  const existe = e.provas.some((x) => x.id === id)
  const provas = existe ? e.provas.map((x) => (x.id === id ? prova : x)) : [...e.provas, prova]
  return { ...e, provas: [...provas].sort((a, b) => a.data.localeCompare(b.data)) }
}

export const removerProva = (e: EstadoApp, id: string): EstadoApp => ({ ...e, provas: e.provas.filter((p) => p.id !== id) })

export function novoLembrete(e: EstadoApp, nome: string, nota = ''): EstadoApp {
  if (!nome.trim()) return e
  const l: Lembrete = { id: idDoNome(nome, e.lembretes.map((x) => x.id)), nome: nome.trim(), nota: nota.trim(), feito: false }
  return { ...e, lembretes: [...e.lembretes, l] }
}

export const alterarLembrete = (e: EstadoApp, id: string, patch: Partial<Omit<Lembrete, 'id'>>): EstadoApp => ({
  ...e,
  lembretes: e.lembretes.map((l) => (l.id === id ? { ...l, ...patch } : l)),
})

export const removerLembrete = (e: EstadoApp, id: string): EstadoApp => ({ ...e, lembretes: e.lembretes.filter((l) => l.id !== id) })

export interface OpcoesNovoConcurso {
  nome: string
  manterMaterias: boolean
  manterParametros: boolean
  manterProvas: boolean
}

/**
 * Começa um concurso do zero: apaga Log, revisão, histórico, caderno de erros e o
 * progresso no edital, e abre o Giro 1 hoje. Matérias, parâmetros e provas ficam se pedido.
 */
export function novoConcurso(e: EstadoApp, o: OpcoesNovoConcurso, hoje: string, padrao: Parametros): EstadoApp {
  const materias = o.manterMaterias ? e.materias : []
  const nome = o.nome.trim()
  const base = o.manterParametros ? e.parametros : padrao
  return {
    ...e,
    parametros: { ...base, concurso: nome || base.concurso },
    provas: o.manterProvas ? e.provas : [],
    materias,
    giro: { numero: 1, inicio: hoje, ordem: materias.filter((m) => m.entraNoGiro).map((m) => m.id), marcacoes: {} },
    historico: [],
    revisao: [],
    lembretes: e.lembretes.map((l) => ({ ...l, feito: false })),
    log: [],
    errosTec: { leitura: '', materias: [], topicos: [] },
    edital: {},
    horasHoje: null,
  }
}
