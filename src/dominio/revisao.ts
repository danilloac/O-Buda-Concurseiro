import type { EstadoApp, Incidencia, LogQuestao, Materia, StatusTopico, TopicoRevisao } from './tipos'
import { totais } from './log'

const normal = (s: string) => s.trim().toLowerCase()

// Regras da aba Revisão (Configuração inicial):
export const REGRAS_REVISAO = {
  metaSaida: 0.7, // sai da fila ao chegar a 70%
  minimoQuestoes: 10, // entra se < 70% com 10 ou mais questões
  pctCritico: 0.4, // ou se < 40% já com 5 questões
  minimoCritico: 5,
  girosParaVoltar: 2, // um tópico compreendido só volta depois de 2 giros
}

const INCIDENCIA_BAIXA: Incidencia[] = ['Baixa', 'Baixíssima']

export function estaNaRevisao(fila: TopicoRevisao[], materia: string, topico: string): boolean {
  return fila.some((t) => normal(t.materia) === normal(materia) && normal(t.topico) === normal(topico) && t.status !== 'Compreendido')
}

export function idDaMateria(materias: Materia[], nome: string): string | undefined {
  return materias.find((m) => normal(m.nome) === normal(nome))?.id
}

export interface Desempenho {
  resolvidas: number
  pct: number | null
  ultimo: string | null // data do último registro
}

/** % acumulado e último registro do tópico, vindos do Log. */
export function desempenhoNoLog(log: LogQuestao[], materiaId: string | undefined, topico: string): Desempenho {
  const linhas = log.filter((l) => l.materiaId === materiaId && normal(l.topico) === normal(topico))
  const t = totais(linhas)
  const ultimo = linhas.reduce<string | null>((m, l) => (m === null || l.data > m ? l.data : m), null)
  return { resolvidas: t.resolvidas, pct: t.pct, ultimo }
}

export function adicionarNaRevisao(
  e: EstadoApp,
  novo: { materia: string; topico: string; acumulado?: number | null; incidencia?: Incidencia; observacao?: string },
  hoje = new Date().toISOString().slice(0, 10),
): EstadoApp {
  if (!novo.topico.trim() || estaNaRevisao(e.revisao, novo.materia, novo.topico)) return e
  // Um tópico já compreendido volta para a fila (mesma linha), em vez de duplicar.
  const antigo = e.revisao.find((t) => normal(t.materia) === normal(novo.materia) && normal(t.topico) === normal(novo.topico))
  if (antigo) {
    return {
      ...e,
      revisao: e.revisao.map((t) =>
        t.id === antigo.id ? { ...t, status: 'Não compreendido', entrouEm: hoje, concluidoEm: undefined, concluidoNoGiro: undefined } : t,
      ),
    }
  }
  const topico: TopicoRevisao = {
    id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    materia: novo.materia,
    topico: novo.topico.trim(),
    observacao: novo.observacao?.trim() ?? '',
    incidencia: novo.incidencia ?? '',
    acumulado: novo.acumulado ?? null,
    status: 'Não compreendido',
    recorrente: false,
    entrouEm: hoje,
  }
  return { ...e, revisao: [...e.revisao, topico] }
}

export function mudarStatus(e: EstadoApp, id: string, status: StatusTopico, hoje: string): EstadoApp {
  return {
    ...e,
    revisao: e.revisao.map((t) => {
      if (t.id !== id) return t
      if (status === 'Compreendido') return { ...t, status, concluidoEm: hoje, concluidoNoGiro: e.giro.numero }
      return { ...t, status, concluidoEm: undefined, concluidoNoGiro: undefined }
    }),
  }
}

export function alterarTopico(e: EstadoApp, id: string, mudanca: Partial<Pick<TopicoRevisao, 'observacao' | 'recorrente' | 'incidencia'>>): EstadoApp {
  return { ...e, revisao: e.revisao.map((t) => (t.id === id ? { ...t, ...mudanca } : t)) }
}

export function removerDaRevisao(e: EstadoApp, id: string): EstadoApp {
  return { ...e, revisao: e.revisao.filter((t) => t.id !== id) }
}

export interface Sugestao {
  materia: string
  topico: string
  resolvidas: number
  pct: number
  motivo: string
}

/**
 * Tópicos do Log que batem os critérios de entrada e ainda não estão na fila:
 * < 70% com 10+ questões, ou < 40% com 5+. Compreendidos só voltam depois de 2 giros,
 * e incidência Baixa/Baixíssima (quando conhecida) não entra.
 */
export function sugestoesDeRevisao(e: EstadoApp): Sugestao[] {
  const r = REGRAS_REVISAO
  const nomes = new Map(e.materias.map((m) => [m.id, m.nome]))
  const grupos = new Map<string, LogQuestao[]>()
  for (const l of e.log) {
    if (!l.topico) continue
    const k = `${l.materiaId}|${normal(l.topico)}`
    grupos.set(k, [...(grupos.get(k) ?? []), l])
  }
  const lista: Sugestao[] = []
  for (const linhas of grupos.values()) {
    const t = totais(linhas)
    const pct = t.pct ?? 0
    const materia = nomes.get(linhas[0].materiaId) ?? linhas[0].materiaId
    const topico = linhas[linhas.length - 1].topico
    let motivo = ''
    if (t.resolvidas >= r.minimoQuestoes && pct < r.metaSaida) motivo = `abaixo de ${Math.round(r.metaSaida * 100)}% com ${t.resolvidas} questões`
    else if (t.resolvidas >= r.minimoCritico && pct < r.pctCritico) motivo = `crítico: abaixo de ${Math.round(r.pctCritico * 100)}%`
    if (!motivo) continue
    const existente = e.revisao.find((x) => normal(x.materia) === normal(materia) && normal(x.topico) === normal(topico))
    if (existente) {
      if (existente.status !== 'Compreendido') continue
      if ((existente.concluidoNoGiro ?? 0) + r.girosParaVoltar > e.giro.numero) continue
      if (INCIDENCIA_BAIXA.includes(existente.incidencia)) continue
    }
    lista.push({ materia, topico, resolvidas: t.resolvidas, pct, motivo })
  }
  return lista.sort((a, b) => a.pct - b.pct)
}
