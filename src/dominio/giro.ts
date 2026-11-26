import type {
  EstadoApp,
  GiroAtual,
  GiroFechado,
  MarcacaoMateria,
  Materia,
  NivelExperiencia,
  Parametros,
  TopicoRevisao,
} from './tipos'

export const MULTIPLICADOR_NIVEL: Record<NivelExperiencia, number> = {
  Iniciante: 1.3,
  Intermediário: 1,
  Avançado: 0.75,
}

export interface Metas {
  minimo: number
  ideal: number
  maximo: number
  cauda: number
}

/** Ajusta as metas base pelo nível, arredondando para blocos inteiros. */
export function metasDaMateria(m: Materia, p: Parametros): Metas {
  const mult = MULTIPLICADOR_NIVEL[p.nivel]
  const b = p.tamanhoBloco
  const ajusta = (v: number) => (v <= 0 ? 0 : Math.max(b, Math.round((v * mult) / b) * b))
  const minimo = ajusta(m.minimo)
  const ideal = Math.max(minimo, ajusta(m.ideal))
  const maximo = Math.max(ideal, ajusta(m.maximo))
  const cauda = Math.min(ideal, m.caudaNoIdeal <= 0 ? 0 : ajusta(m.caudaNoIdeal))
  return { minimo, ideal, maximo, cauda }
}

export function quantidadeDeBlocos(metas: Metas, tamanhoBloco: number): number {
  return Math.ceil(metas.maximo / tamanhoBloco)
}

export function marcacaoVazia(nBlocos: number): MarcacaoMateria {
  return { blocos: Array(nBlocos).fill(false), erros: false, revisao: false }
}

export function questoesFeitas(marc: MarcacaoMateria | undefined, metas: Metas, tamanhoBloco: number): number {
  if (!marc) return 0
  const marcados = marc.blocos.filter(Boolean).length
  return Math.min(marcados * tamanhoBloco, metas.maximo)
}

export type StatusMateria = 'a-fazer' | 'andamento' | 'minimo' | 'ideal' | 'maximo'

export function statusDaMateria(feitas: number, metas: Metas): StatusMateria {
  if (feitas <= 0) return 'a-fazer'
  if (feitas >= metas.maximo) return 'maximo'
  if (feitas >= metas.ideal) return 'ideal'
  if (feitas >= metas.minimo) return 'minimo'
  return 'andamento'
}

export function rotuloStatus(status: StatusMateria, feitas: number, metas: Metas): string {
  switch (status) {
    case 'a-fazer':
      return 'A fazer'
    case 'andamento':
      return `${feitas} de ${metas.minimo}`
    case 'minimo':
      return 'Concluída · mínimo'
    case 'ideal':
      return 'Concluída · ideal'
    case 'maximo':
      return 'Máximo · pare'
  }
}

export const concluida = (s: StatusMateria) => s === 'minimo' || s === 'ideal' || s === 'maximo'

export type FaixaBloco = 'minimo' | 'ideal' | 'cauda' | 'extra'

/** Em que faixa da meta cai o bloco i (0-based), para colorir. */
export function faixaDoBloco(i: number, metas: Metas, tamanhoBloco: number): FaixaBloco {
  const fim = (i + 1) * tamanhoBloco
  if (fim <= metas.minimo) return 'minimo'
  if (fim <= metas.ideal - metas.cauda) return 'ideal'
  if (fim <= metas.ideal) return 'cauda'
  return 'extra'
}

/** Matéria a revisar: a que está N posições antes no ciclo (com volta). */
export function materiaDaRevisao(ordem: string[], indice: number, espacamento: number): string | undefined {
  const n = ordem.length
  if (n === 0) return undefined
  return ordem[(((indice - espacamento) % n) + n) % n]
}

export interface LinhaGiro {
  materia: Materia
  metas: Metas
  marcacao: MarcacaoMateria
  feitas: number
  status: StatusMateria
  revisarMateria: Materia | undefined
}

export function linhasDoGiro(estado: EstadoApp): LinhaGiro[] {
  const { giro, materias, parametros: p } = estado
  const porId = new Map(materias.map((m) => [m.id, m]))
  const ordem = giro.ordem.filter((id) => porId.get(id)?.entraNoGiro)
  return ordem.map((id, i) => {
    const materia = porId.get(id)!
    const metas = metasDaMateria(materia, p)
    const nBlocos = quantidadeDeBlocos(metas, p.tamanhoBloco)
    const salvo = giro.marcacoes[id]
    const marcacao: MarcacaoMateria = {
      blocos: Array.from({ length: nBlocos }, (_, b) => salvo?.blocos[b] ?? false),
      erros: salvo?.erros ?? false,
      revisao: salvo?.revisao ?? false,
    }
    const feitas = questoesFeitas(marcacao, metas, p.tamanhoBloco)
    const revisarId = materiaDaRevisao(ordem, i, p.espacamentoRevisao)
    return {
      materia,
      metas,
      marcacao,
      feitas,
      status: statusDaMateria(feitas, metas),
      revisarMateria: revisarId ? porId.get(revisarId) : undefined,
    }
  })
}

export interface ResumoGiro {
  numero: number
  inicio: string
  totalMaterias: number
  concluidas: number
  proxima: Materia | undefined
  feitas: number
  meta: number
  comErros: number
  comRevisao: number
  podeFechar: boolean
}

export function resumoDoGiro(estado: EstadoApp, linhas = linhasDoGiro(estado)): ResumoGiro {
  const concluidas = linhas.filter((l) => concluida(l.status)).length
  return {
    numero: estado.giro.numero,
    inicio: estado.giro.inicio,
    totalMaterias: linhas.length,
    concluidas,
    proxima: linhas.find((l) => !concluida(l.status))?.materia,
    feitas: linhas.reduce((s, l) => s + l.feitas, 0),
    meta: linhas.reduce((s, l) => s + l.metas.ideal, 0),
    comErros: linhas.filter((l) => l.marcacao.erros).length,
    comRevisao: linhas.filter((l) => l.marcacao.revisao).length,
    podeFechar: linhas.length > 0 && concluidas === linhas.length,
  }
}

export interface PlanoDoDia {
  horas: number
  revisoes: number
  minutosRevisao: number
  ineditas: number
  blocos: number
  erros: number
  comecarPor: Materia | undefined
  topicos: TopicoRevisao[]
}

/**
 * "Programe seu dia" do Diário:
 * revisões = teto(horas ÷ ritmo); inéditas = o tempo que sobra depois de erros
 * e revisões, dividido pelo tempo por inédita, arredondado para baixo em blocos.
 */
export function planoDoDia(estado: EstadoApp, horas: number, resumo = resumoDoGiro(estado)): PlanoDoDia {
  const p = estado.parametros
  const h = Math.max(0, horas)
  const revisoes = h > 0 ? Math.ceil(h / p.ritmoRevisaoHoras) : 0
  const minutosRevisao = revisoes * p.minPorRevisao
  const erros = h > 0 ? p.errosPorDia : 0
  const livre = h * 60 - erros * p.minPorErro - minutosRevisao
  const brutas = Math.max(0, Math.floor(livre / p.minPorInedita))
  const ineditas = Math.floor(brutas / p.tamanhoBloco) * p.tamanhoBloco
  const topicos = estado.revisao.filter((t) => t.status !== 'Compreendido').slice(0, revisoes)
  return {
    horas: h,
    revisoes,
    minutosRevisao,
    ineditas,
    blocos: ineditas / p.tamanhoBloco,
    erros,
    comecarPor: resumo.proxima,
    topicos,
  }
}

/** Ritmo estimado do Formulário inicial: semanas para fechar 1 giro. */
export function semanasPorGiro(estado: EstadoApp, resumo = resumoDoGiro(estado)): number {
  const p = estado.parametros
  const horasSemana = p.horasPorDia * p.diasPorSemana
  if (horasSemana <= 0) return Infinity
  return (resumo.meta * p.minPorInedita) / 60 / horasSemana
}

export function fecharGiro(estado: EstadoApp, hoje: string): EstadoApp {
  const linhas = linhasDoGiro(estado)
  const resumo = resumoDoGiro(estado, linhas)
  const fechado: GiroFechado = {
    numero: resumo.numero,
    inicio: resumo.inicio,
    fechamento: hoje,
    feitas: resumo.feitas,
    meta: resumo.meta,
    materiasComErros: resumo.comErros,
    materiasComRevisao: resumo.comRevisao,
    totalMaterias: resumo.totalMaterias,
  }
  const novo: GiroAtual = {
    numero: resumo.numero + 1,
    inicio: hoje,
    ordem: estado.giro.ordem,
    marcacoes: {},
  }
  return { ...estado, giro: novo, historico: [...estado.historico, fechado] }
}

export function alternarBloco(estado: EstadoApp, materiaId: string, indice: number): EstadoApp {
  const linha = linhasDoGiro(estado).find((l) => l.materia.id === materiaId)
  if (!linha) return estado
  const blocos = [...linha.marcacao.blocos]
  // Marcar um bloco marca os anteriores; desmarcar desmarca os seguintes.
  const marcar = !blocos[indice]
  for (let i = 0; i < blocos.length; i++) {
    if (marcar && i <= indice) blocos[i] = true
    if (!marcar && i >= indice) blocos[i] = false
  }
  return comMarcacao(estado, materiaId, { ...linha.marcacao, blocos })
}

export function alternarCheck(estado: EstadoApp, materiaId: string, campo: 'erros' | 'revisao'): EstadoApp {
  const linha = linhasDoGiro(estado).find((l) => l.materia.id === materiaId)
  if (!linha) return estado
  return comMarcacao(estado, materiaId, { ...linha.marcacao, [campo]: !linha.marcacao[campo] })
}

function comMarcacao(estado: EstadoApp, materiaId: string, marc: MarcacaoMateria): EstadoApp {
  return {
    ...estado,
    giro: { ...estado.giro, marcacoes: { ...estado.giro.marcacoes, [materiaId]: marc } },
  }
}

export function moverNaOrdem(estado: EstadoApp, materiaId: string, delta: -1 | 1): EstadoApp {
  const ordem = [...estado.giro.ordem]
  const i = ordem.indexOf(materiaId)
  const j = i + delta
  if (i < 0 || j < 0 || j >= ordem.length) return estado
  ;[ordem[i], ordem[j]] = [ordem[j], ordem[i]]
  return { ...estado, giro: { ...estado.giro, ordem } }
}
