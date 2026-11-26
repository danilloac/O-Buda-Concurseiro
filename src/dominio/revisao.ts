import type { EstadoApp, Incidencia, TopicoRevisao } from './tipos'

const normal = (s: string) => s.trim().toLowerCase()

export function estaNaRevisao(fila: TopicoRevisao[], materia: string, topico: string): boolean {
  return fila.some((t) => normal(t.materia) === normal(materia) && normal(t.topico) === normal(topico) && t.status !== 'Compreendido')
}

export function adicionarNaRevisao(
  e: EstadoApp,
  novo: { materia: string; topico: string; acumulado?: number | null; incidencia?: Incidencia; observacao?: string },
): EstadoApp {
  if (estaNaRevisao(e.revisao, novo.materia, novo.topico)) return e
  const topico: TopicoRevisao = {
    id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    materia: novo.materia,
    topico: novo.topico,
    observacao: novo.observacao ?? '',
    incidencia: novo.incidencia ?? '',
    acumulado: novo.acumulado ?? null,
    status: 'Não compreendido',
    recorrente: false,
  }
  return { ...e, revisao: [...e.revisao, topico] }
}
