import type { EstadoApp, ItemEdital, LogQuestao, Materia, StatusEdital } from './tipos'
import { idDoNome } from './config'
import { topicosDaMateria, totais } from './log'

/** 'todos' ou o nome de um concurso (ex.: 'TRT 8'). */
export type Recorte = string

export const STATUS_EDITAL: StatusEdital[] = ['Não visto', 'Teoria', 'Questões', 'Revisado']

const semAcento = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

/** '' e 'Ambos' valem para todos; 'Só TRT 8' e 'TRT 8' são do concurso TRT 8. */
export function concursoDoItem(i: Pick<ItemEdital, 'edital'>): string | null {
  const t = i.edital.trim()
  if (!t || /^(ambos|todos|comum)$/i.test(t)) return null
  return t.replace(/^s[oó]\s+/i, '')
}

export function concursosDoEdital(itens: ItemEdital[]): string[] {
  return [...new Set(itens.map(concursoDoItem).filter((c): c is string => c !== null))]
}

/** Itens que caem no recorte: os comuns mais os exclusivos daquele concurso. */
export function noRecorte(itens: ItemEdital[], recorte: Recorte): ItemEdital[] {
  if (recorte === 'todos') return itens
  return itens.filter((i) => {
    const c = concursoDoItem(i)
    return c === null || c === recorte
  })
}

export function comparacao(itens: ItemEdital[]) {
  const porConcurso: Record<string, number> = {}
  let comuns = 0
  for (const i of itens) {
    const c = concursoDoItem(i)
    if (c === null) comuns++
    else porConcurso[c] = (porConcurso[c] ?? 0) + 1
  }
  return { comuns, porConcurso }
}

export function statusDe(mapa: Record<string, StatusEdital>, n: number): StatusEdital {
  return mapa[String(n)] ?? 'Não visto'
}

export function proximoStatus(s: StatusEdital): StatusEdital {
  return STATUS_EDITAL[(STATUS_EDITAL.indexOf(s) + 1) % STATUS_EDITAL.length]
}

export function marcarItem(e: EstadoApp, n: number, s: StatusEdital): EstadoApp {
  const edital = { ...e.edital }
  if (s === 'Não visto') delete edital[String(n)]
  else edital[String(n)] = s
  return { ...e, edital }
}

export type Contagem = Record<StatusEdital, number>

export function contar(itens: ItemEdital[], mapa: Record<string, StatusEdital>): Contagem {
  const c: Contagem = { 'Não visto': 0, Teoria: 0, Questões: 0, Revisado: 0 }
  for (const i of itens) c[statusDe(mapa, i.n)]++
  return c
}

/** Quanto do recorte já foi visto (qualquer status além de Não visto). */
export const pctVisto = (c: Contagem) => {
  const total = c['Não visto'] + c.Teoria + c.Questões + c.Revisado
  return total ? (total - c['Não visto']) / total : 0
}

export interface GrupoEdital {
  materiaId: string
  itens: ItemEdital[]
  contagem: Contagem
  questoes: number
  acerto: number | null
}

/** Agrupa por matéria na ordem do edital, com o desempenho da matéria no Log. */
export function porMateria(itens: ItemEdital[], mapa: Record<string, StatusEdital>, log: LogQuestao[]): GrupoEdital[] {
  const grupos = new Map<string, ItemEdital[]>()
  for (const i of itens) grupos.set(i.materiaId, [...(grupos.get(i.materiaId) ?? []), i])
  return [...grupos].map(([materiaId, lista]) => {
    const t = totais(log.filter((l) => l.materiaId === materiaId))
    return { materiaId, itens: lista, contagem: contar(lista, mapa), questoes: t.resolvidas, acerto: t.pct }
  })
}

/** Tópicos para sugerir num campo: os já usados no Log e depois os itens do edital. */
export function sugestoesDeTopico(e: Pick<EstadoApp, 'log' | 'editalItens'>, materiaId: string): string[] {
  const doLog = topicosDaMateria(e.log, materiaId)
  const vistos = new Set(doLog.map(semAcento))
  const doEdital = e.editalItens.filter((i) => i.materiaId === materiaId && !vistos.has(semAcento(i.item))).map((i) => i.item)
  return [...doLog, ...new Set(doEdital)]
}

// ---------- importação ----------

export interface ItemLido {
  materia: string
  item: string
  edital: string
}

export interface Leitura {
  itens: ItemLido[]
  avisos: string[]
}

const NUMERACAO = /^\s*(?:[-•*–—▪◦]|\(?\d{1,3}(?:\.\d{1,3})*[.)\-–]?|[a-z]\))\s+/i
const limpa = (s: string) => s.replace(NUMERACAO, '').replace(/\s+/g, ' ').replace(/[.;,]\s*$/, '').trim()

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o', 'à', 'ao', 'na', 'no', 'para', 'com'])

/** "NOÇÕES DE DIREITO ADMINISTRATIVO" → "Noções de Direito Administrativo"; siglas curtas ficam (TI, SQL). */
export function nomeDeMateria(nome: string): string {
  const letras = nome.replace(/[^\p{L}]/gu, '')
  if (!letras || letras !== letras.toUpperCase()) return nome.trim()
  return nome
    .trim()
    .split(/\s+/)
    .map((p, i) => {
      const min = p.toLowerCase()
      if (i > 0 && MINUSCULAS.has(min)) return min
      if (p.length <= 3 && i > 0) return p
      return min.charAt(0).toUpperCase() + min.slice(1)
    })
    .join(' ')
}

/** Um cabeçalho "LÍNGUA PORTUGUESA:" (ou "# Língua Portuguesa") vira matéria. */
function cabecalho(linha: string): { nome: string; resto: string } | null {
  const t = linha.trim()
  if (t.startsWith('#')) return { nome: nomeDeMateria(t.replace(/^#+\s*/, '').replace(/:$/, '')), resto: '' }
  const m = t.match(/^([^:]{2,80}):\s*(.*)$/)
  if (!m || NUMERACAO.test(t)) return null
  const nome = m[1].trim()
  const letras = nome.replace(/[^\p{L}]/gu, '')
  const maiusculas = letras.replace(/[^\p{Lu}]/gu, '').length
  // Aceita "NOME:" em maiúsculas, ou "Nome:" sozinho na linha.
  if ((letras.length && maiusculas / letras.length > 0.7) || !m[2]) return { nome: nomeDeMateria(nome), resto: m[2] }
  return null
}

/** Quebra "1 Ortografia. 2 Crase. 3 Pontuação." em itens. */
function quebraNumerados(texto: string): string[] {
  const partes = texto.split(/(?:^|\s)\d{1,2}(?:\.\d{1,2})*[.)]?\s+(?=\p{Lu})/u).map(limpa).filter(Boolean)
  return partes.length > 1 ? partes : [limpa(texto)].filter(Boolean)
}

/**
 * Lê um edital colado ou um CSV/TSV.
 * - Tabela (tab, ; ou , com 2 ou 3 colunas): matéria, item, concurso (opcional).
 * - Texto: "# Matéria" ou "MATÉRIA:" abre a matéria; cada linha seguinte é um item,
 *   e uma linha com "1 ... 2 ..." vira vários itens.
 */
export function lerEdital(texto: string): Leitura {
  const linhas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  const itens: ItemLido[] = []
  const avisos: string[] = []
  const sep = ['\t', ';'].find((s) => linhas.filter((l) => l.includes(s)).length >= linhas.length * 0.6)
  const csv = !sep && linhas.length > 0 && linhas.every((l) => l.split(',').length >= 2 && l.split(',').length <= 3)

  if (sep || csv) {
    for (const [i, l] of linhas.entries()) {
      const cols = l.split(sep ?? ',').map((c) => c.trim().replace(/^"|"$/g, ''))
      if (i === 0 && /mat[eé]ria/i.test(cols[0])) continue
      if (cols.length < 2 || !cols[0] || !cols[1]) {
        avisos.push(`Linha ${i + 1} ignorada: precisa de matéria e item.`)
        continue
      }
      itens.push({ materia: cols[0], item: limpa(cols[1]), edital: cols[2] ?? '' })
    }
    return { itens, avisos }
  }

  let materia = ''
  let soltos = 0
  for (const l of linhas) {
    const c = cabecalho(l)
    if (c) {
      materia = c.nome
      if (c.resto) for (const it of quebraNumerados(c.resto)) itens.push({ materia, item: it, edital: '' })
      continue
    }
    if (!materia) {
      soltos++
      continue
    }
    for (const it of quebraNumerados(l)) itens.push({ materia, item: it, edital: '' })
  }
  if (soltos) avisos.push(`${soltos} linha${soltos > 1 ? 's' : ''} antes da primeira matéria ficaram de fora.`)
  if (!itens.length) avisos.push('Nenhum item encontrado. Comece cada matéria com "# Nome" ou "NOME DA MATÉRIA:".')
  return { itens, avisos }
}

/** Acha a matéria pelo nome, sem diferenciar acentos e maiúsculas. */
export function materiaPeloNome(materias: Materia[], nome: string): Materia | undefined {
  const alvo = semAcento(nome)
  return materias.find((m) => semAcento(m.nome) === alvo)
}

export function resumoDaLeitura(materias: Materia[], itens: ItemLido[]) {
  const grupos = new Map<string, { nome: string; itens: number; nova: boolean }>()
  for (const i of itens) {
    const k = semAcento(i.materia)
    const g = grupos.get(k) ?? { nome: i.materia, itens: 0, nova: !materiaPeloNome(materias, i.materia) }
    g.itens++
    grupos.set(k, g)
  }
  return { materias: [...grupos.values()], concursos: concursosDoEdital(itens.map((i, n) => ({ n, bloco: '', materiaId: '', ...i }))) }
}

export function aplicarEdital(e: EstadoApp, itens: ItemLido[], o: { substituir: boolean; novasNoGiro: boolean }): EstadoApp {
  const materias = [...e.materias]
  const ordem = [...e.giro.ordem]
  const idDe = (nome: string) => {
    const m = materiaPeloNome(materias, nome)
    if (m) return m.id
    const id = idDoNome(nome, materias.map((x) => x.id))
    materias.push({
      id,
      nome: nome.trim(),
      entraNoGiro: o.novasNoGiro,
      nivel: 'Dificuldade',
      minimo: o.novasNoGiro ? 6 : 0,
      ideal: o.novasNoGiro ? 9 : 0,
      maximo: o.novasNoGiro ? 15 : 0,
      caudaNoIdeal: 0,
      extraVaiPara: 'Núcleo',
    })
    if (o.novasNoGiro) ordem.push(id)
    return id
  }
  const base = o.substituir ? [] : e.editalItens
  let n = base.reduce((max, i) => Math.max(max, i.n), 0)
  const novos: ItemEdital[] = itens.map((i) => ({ n: ++n, bloco: '', materiaId: idDe(i.materia), item: i.item, edital: i.edital }))
  return {
    ...e,
    materias,
    giro: { ...e.giro, ordem },
    editalItens: [...base, ...novos],
    edital: o.substituir ? {} : e.edital,
  }
}
