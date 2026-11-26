import { diasEntre } from './datas'
import { totais } from './log'
import type { EstadoApp, LogQuestao } from './tipos'

export interface LinhaHistorico {
  numero: number
  inicio: string
  fim: string // fechamento, ou hoje no giro em andamento
  emAndamento: boolean
  dias: number | null
  concluidas: number | null
  totalMaterias: number
  questoes: number
  acerto: number | null
  erros: string // "11 dias" (planilha) ou "9/11 matérias" (app)
  revisao: string
}

/** Questões do Log entre o início (inclusive) e o fechamento (exclusive) do giro. */
export function logDoGiro(log: LogQuestao[], inicio: string, fim: string | null): LogQuestao[] {
  return log.filter((l) => (!inicio || l.data >= inicio) && (fim === null || l.data < fim))
}

const contaDias = (n: number) => `${n} dia${n === 1 ? '' : 's'}`

export function linhasDoHistorico(estado: EstadoApp, hoje: string, concluidasAgora: number, totalAgora: number): LinhaHistorico[] {
  const fechados = estado.historico.map((g): LinhaHistorico => {
    const t = totais(logDoGiro(estado.log, g.inicio, g.fechamento))
    return {
      numero: g.numero,
      inicio: g.inicio,
      fim: g.fechamento,
      emAndamento: false,
      dias: g.inicio ? diasEntre(g.inicio, g.fechamento) : null,
      concluidas: g.concluidas ?? null,
      totalMaterias: g.totalMaterias,
      questoes: t.resolvidas,
      acerto: t.pct,
      erros: g.diasErros !== undefined ? contaDias(g.diasErros) : `${g.materiasComErros ?? 0}/${g.totalMaterias} matérias`,
      revisao: g.diasRevisao !== undefined ? contaDias(g.diasRevisao) : `${g.materiasComRevisao ?? 0}/${g.totalMaterias} matérias`,
    }
  })
  const t = totais(logDoGiro(estado.log, estado.giro.inicio, null))
  const atual: LinhaHistorico = {
    numero: estado.giro.numero,
    inicio: estado.giro.inicio,
    fim: hoje,
    emAndamento: true,
    dias: diasEntre(estado.giro.inicio, hoje),
    concluidas: concluidasAgora,
    totalMaterias: totalAgora,
    questoes: t.resolvidas,
    acerto: t.pct,
    erros: '—',
    revisao: '—',
  }
  return [...fechados, atual]
}

export function duracaoMedia(linhas: LinhaHistorico[]): number | null {
  const d = linhas.filter((l) => !l.emAndamento && l.dias !== null).map((l) => l.dias!)
  return d.length ? d.reduce((s, x) => s + x, 0) / d.length : null
}
