import type { LogQuestao } from './tipos'
import { semanaDe, totais } from './log'

export interface LinhaRaioX {
  chave: string
  materiaId: string
  topico: string
  resolvidas: number
  acertos: number
  pct: number
  ultimaSemana: { resolvidas: number; pct: number | null }
  semanaAnterior: { resolvidas: number; pct: number | null }
  variacao: number | null // pontos percentuais (0 a 1) da semana anterior para a última
}

export interface FiltroRaioX {
  materiaId: string // '' = todas
  minimo: number // mínimo de questões no tópico
}

function semanaAntes(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 7)).toISOString().slice(0, 10)
}

/**
 * Raio-X: agrupa o Log por matéria + tópico e ordena do mais fraco para o mais forte.
 * "Última semana" é a semana do registro mais recente do Log.
 */
export function raioX(log: LogQuestao[], filtro: FiltroRaioX): LinhaRaioX[] {
  if (log.length === 0) return []
  const ultima = semanaDe(log.reduce((max, l) => (l.data > max ? l.data : max), log[0].data))
  const anterior = semanaAntes(ultima)
  const grupos = new Map<string, LogQuestao[]>()
  for (const l of log) {
    if (filtro.materiaId && l.materiaId !== filtro.materiaId) continue
    const chave = `${l.materiaId}|${l.topico}`
    const lista = grupos.get(chave) ?? []
    lista.push(l)
    grupos.set(chave, lista)
  }
  const linhas: LinhaRaioX[] = []
  for (const [chave, lista] of grupos) {
    const t = totais(lista)
    if (t.resolvidas < filtro.minimo) continue
    const u = totais(lista.filter((l) => semanaDe(l.data) === ultima))
    const a = totais(lista.filter((l) => semanaDe(l.data) === anterior))
    linhas.push({
      chave,
      materiaId: lista[0].materiaId,
      topico: lista[0].topico,
      resolvidas: t.resolvidas,
      acertos: t.acertos,
      pct: t.pct ?? 0,
      ultimaSemana: { resolvidas: u.resolvidas, pct: u.pct },
      semanaAnterior: { resolvidas: a.resolvidas, pct: a.pct },
      variacao: u.pct !== null && a.pct !== null ? u.pct - a.pct : null,
    })
  }
  return linhas.sort((x, y) => x.pct - y.pct || y.resolvidas - x.resolvidas)
}
