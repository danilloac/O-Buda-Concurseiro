import type { ConcursoEdital, ItemEdital } from '../dominio/tipos'
import bruto from './edital-inicial.json'

/** Edital verticalizado da planilha: 239 itens, TRT 8 e TRT 4 (FCC). */
export const EDITAL: ItemEdital[] = (bruto as [number, string, string, string, ConcursoEdital][]).map(
  ([n, bloco, materiaId, item, edital]) => ({ n, bloco, materiaId, item, edital }),
)
