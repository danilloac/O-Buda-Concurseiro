import type { EstadoApp, ItemEdital, LogQuestao, StatusEdital } from './tipos'
import { totais } from './log'

export type Recorte = 'todos' | 'trt8' | 'trt4'

export const STATUS_EDITAL: StatusEdital[] = ['Não visto', 'Teoria', 'Questões', 'Revisado']

/** Itens que caem no recorte: TRT 8 = Ambos + Só TRT 8; TRT 4 = Ambos + Só TRT 4. */
export function noRecorte(itens: ItemEdital[], recorte: Recorte): ItemEdital[] {
  if (recorte === 'todos') return itens
  const fora = recorte === 'trt8' ? 'Só TRT 4' : 'Só TRT 8'
  return itens.filter((i) => i.edital !== fora)
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

export function comparacao(itens: ItemEdital[]) {
  const c = { ambos: 0, so8: 0, so4: 0 }
  for (const i of itens) {
    if (i.edital === 'Ambos') c.ambos++
    else if (i.edital === 'Só TRT 8') c.so8++
    else c.so4++
  }
  return c
}
