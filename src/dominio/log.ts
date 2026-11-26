import type { EstadoApp, LogQuestao } from './tipos'

export interface Totais {
  resolvidas: number
  acertos: number
  pct: number | null // 0 a 1; null sem questões
}

export function totais(linhas: LogQuestao[]): Totais {
  const resolvidas = linhas.reduce((s, l) => s + l.resolvidas, 0)
  const acertos = linhas.reduce((s, l) => s + l.acertos, 0)
  return { resolvidas, acertos, pct: resolvidas ? acertos / resolvidas : null }
}

/** Segunda-feira da semana da data (coluna "Semana" do Log). */
export function semanaDe(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const desloca = (dt.getUTCDay() + 6) % 7 // segunda = 0
  dt.setUTCDate(dt.getUTCDate() - desloca)
  return dt.toISOString().slice(0, 10)
}

export const doDia = (log: LogQuestao[], data: string) => log.filter((l) => l.data === data)
export const daSemana = (log: LogQuestao[], data: string) => {
  const s = semanaDe(data)
  return log.filter((l) => semanaDe(l.data) === s)
}
/** "Registradas no Log desde o início do giro". */
export const desde = (log: LogQuestao[], inicio: string) => log.filter((l) => l.data >= inicio)

/** Tópicos já usados na matéria, do mais recente para o mais antigo, para o autocompletar. */
export function topicosDaMateria(log: LogQuestao[], materiaId: string): string[] {
  const vistos = new Set<string>()
  const ordenado = [...log].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  for (const l of ordenado) if (l.materiaId === materiaId && l.topico) vistos.add(l.topico)
  return [...vistos]
}

export interface Rascunho {
  data: string
  materiaId: string
  topico: string
  resolvidas: number
  acertos: number
  obs: string
}

/** Mensagem de erro para o formulário, ou null se está tudo certo. */
export function validar(r: Rascunho): string | null {
  if (!r.data) return 'Escolha a data.'
  if (!r.materiaId) return 'Escolha a matéria.'
  if (!Number.isInteger(r.resolvidas) || r.resolvidas < 1) return 'Resolvidas precisa ser 1 ou mais.'
  if (!Number.isInteger(r.acertos) || r.acertos < 0) return 'Acertos não pode ser negativo.'
  if (r.acertos > r.resolvidas) return 'Acertos não pode passar de resolvidas.'
  return null
}

const novoId = () => `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function registrar(e: EstadoApp, r: Rascunho): EstadoApp {
  const linha: LogQuestao = { id: novoId(), ...r, topico: r.topico.trim(), obs: r.obs.trim() }
  return { ...e, log: [...e.log, linha] }
}

export function editar(e: EstadoApp, id: string, r: Rascunho): EstadoApp {
  return {
    ...e,
    log: e.log.map((l) => (l.id === id ? { ...l, ...r, topico: r.topico.trim(), obs: r.obs.trim() } : l)),
  }
}

export function remover(e: EstadoApp, id: string): EstadoApp {
  return { ...e, log: e.log.filter((l) => l.id !== id) }
}

export interface Dia {
  data: string
  linhas: LogQuestao[]
  totais: Totais
}

/** Log agrupado por dia, do mais recente para o mais antigo. */
export function porDia(log: LogQuestao[]): Dia[] {
  const mapa = new Map<string, LogQuestao[]>()
  for (const l of log) {
    const lista = mapa.get(l.data) ?? []
    lista.push(l)
    mapa.set(l.data, lista)
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([data, linhas]) => ({ data, linhas: linhas.slice().reverse(), totais: totais(linhas) }))
}

export type Faixa = 'bom' | 'medio' | 'fraco'

/** Cor do % de acerto: na meta, perto dela (até 20 pontos abaixo) ou longe. */
export function faixaAcerto(pct: number, meta: number): Faixa {
  if (pct >= meta) return 'bom'
  if (pct >= meta - 0.2) return 'medio'
  return 'fraco'
}

export const fmtPct = (p: number | null) => (p === null ? '—' : `${Math.round(p * 100)}%`)
