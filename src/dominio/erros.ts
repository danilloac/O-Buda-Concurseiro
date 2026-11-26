import type { ErrosTec, Incidencia, LogQuestao } from './tipos'
import { desempenhoNoLog } from './revisao'

export const LIMITES_ERROS = {
  erraMuito: 1.3, // erra × peso ≥ 1,3: erra mais do que a matéria pesa
  erraPouco: 0.7, // ≤ 0,7: erra pouco para o peso
  acertoOk: 0.75, // tópico com % nas inéditas abaixo disso fica Fraco
}

export type LeituraPeso = 'mais' | 'proporcional' | 'pouco' | 'sem-peso'

export interface LinhaErroMateria {
  materiaId: string
  noCaderno: number
  pctErros: number // fatia dos seus erros (0 a 1)
  pctProva: number | null
  erraPeso: number | null
  leitura: LeituraPeso
  recorrentes: number
  acertoRefazer: number | null
}

/** Erra × peso = % dos seus erros ÷ % da prova. */
export function errosPorMateria(erros: ErrosTec): LinhaErroMateria[] {
  const total = erros.materias.reduce((s, m) => s + m.noCaderno, 0)
  return erros.materias
    .map((m) => {
      const pctErros = total ? m.noCaderno / total : 0
      const erraPeso = m.pctProva ? pctErros / m.pctProva : null
      let leitura: LeituraPeso = 'sem-peso'
      if (erraPeso !== null) {
        const r = Math.round(erraPeso * 10) / 10 // a planilha compara o valor com 1 casa
        leitura = r >= LIMITES_ERROS.erraMuito ? 'mais' : r <= LIMITES_ERROS.erraPouco ? 'pouco' : 'proporcional'
      }
      return { ...m, pctErros, erraPeso, leitura }
    })
    .sort((a, b) => (b.erraPeso ?? -1) - (a.erraPeso ?? -1))
}

export type Situacao = 'cronico' | 'fraco' | 'ok' | 'baixa'

export function situacaoDoTopico(t: { recorrentes: number; incidencia: Incidencia }, pctLog: number | null): Situacao {
  if (t.incidencia === 'Baixa' || t.incidencia === 'Baixíssima') return 'baixa'
  if (t.recorrentes > 0) return 'cronico'
  if (pctLog !== null && pctLog < LIMITES_ERROS.acertoOk) return 'fraco'
  return 'ok'
}

export interface LinhaErroTopico {
  materiaId: string
  topico: string
  noCaderno: number
  recorrentes: number
  incidencia: Incidencia
  acertoRefazer: number | null
  pctLog: number | null
  situacao: Situacao
}

const ORDEM: Record<Situacao, number> = { cronico: 0, fraco: 1, ok: 2, baixa: 3 }

export function errosPorTopico(erros: ErrosTec, log: LogQuestao[]): LinhaErroTopico[] {
  return erros.topicos
    .map((t) => {
      const refeitas = t.refeitasAcertos + t.refeitasErros
      const pctLog = desempenhoNoLog(log, t.materiaId, t.topico).pct
      return {
        materiaId: t.materiaId,
        topico: t.topico,
        noCaderno: t.noCaderno,
        recorrentes: t.recorrentes,
        incidencia: t.incidencia,
        acertoRefazer: refeitas ? t.refeitasAcertos / refeitas : null,
        pctLog,
        situacao: situacaoDoTopico(t, pctLog),
      }
    })
    .sort((a, b) => ORDEM[a.situacao] - ORDEM[b.situacao] || b.recorrentes - a.recorrentes || b.noCaderno - a.noCaderno)
}
