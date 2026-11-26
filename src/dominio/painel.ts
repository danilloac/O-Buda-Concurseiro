import type { EstadoApp, LogQuestao, Materia } from './tipos'
import { semanaDe, totais, type Totais } from './log'

export interface Semana extends Totais {
  semana: string // segunda-feira, AAAA-MM-DD
}

function somaDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + dias))
  return dt.toISOString().slice(0, 10)
}

/** Todas as semanas do primeiro ao último registro (semanas sem estudo entram zeradas). */
export function semanasDoLog(log: LogQuestao[]): string[] {
  if (log.length === 0) return []
  const datas = log.map((l) => l.data).sort()
  const fim = semanaDe(datas[datas.length - 1])
  const lista: string[] = []
  for (let s = semanaDe(datas[0]); s <= fim; s = somaDias(s, 7)) lista.push(s)
  return lista
}

/** "Questões por semana" e "Acerto semanal" da aba Gráficos. */
export function porSemana(log: LogQuestao[], semanas = semanasDoLog(log)): Semana[] {
  const grupos = new Map<string, LogQuestao[]>(semanas.map((s) => [s, []]))
  for (const l of log) grupos.get(semanaDe(l.data))?.push(l)
  return semanas.map((semana) => ({ semana, ...totais(grupos.get(semana) ?? []) }))
}

export interface LinhaMateria extends Totais {
  materia: Materia
  semanas: Semana[] // evolução, alinhada às semanas do Log inteiro
}

/** Tabela por matéria da Visão Geral, com a evolução semanal de cada uma. */
export function porMateria(estado: EstadoApp): LinhaMateria[] {
  const semanas = semanasDoLog(estado.log)
  return estado.materias
    .map((materia) => {
      const linhas = estado.log.filter((l) => l.materiaId === materia.id)
      return { materia, ...totais(linhas), semanas: porSemana(linhas, semanas) }
    })
    .filter((l) => l.resolvidas > 0)
    .sort((a, b) => b.resolvidas - a.resolvidas)
}

export interface ResumoGeral extends Totais {
  girosCompletos: number
  diasEstudados: number
  mediaPorDia: number
}

export function resumoGeral(estado: EstadoApp): ResumoGeral {
  const t = totais(estado.log)
  const dias = new Set(estado.log.map((l) => l.data)).size
  return {
    ...t,
    // O giro atual é o número N; os anteriores (1 a N-1) estão completos.
    girosCompletos: Math.max(0, estado.giro.numero - 1),
    diasEstudados: dias,
    mediaPorDia: dias ? t.resolvidas / dias : 0,
  }
}
