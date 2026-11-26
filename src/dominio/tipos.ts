// Modelo de dados do app. Espelha as abas da planilha "Método do Buda":
// Formulário inicial + Configuração inicial (parâmetros e matérias),
// Diário (giro atual), Histórico (giros fechados) e Revisão (fila de teoria).

export type NivelExperiencia = 'Iniciante' | 'Intermediário' | 'Avançado'
export type NivelMateria = 'Facilidade' | 'Dificuldade' | 'Lei seca'
export type DestinoExtra = 'Núcleo' | 'Cauda' | 'Caderno único'
export type Incidencia = 'Altíssima' | 'Alta' | 'Moderada' | 'Baixa' | 'Baixíssima' | ''
export type StatusTopico = 'Não compreendido' | 'Parcialmente compreendido' | 'Compreendido'

export interface Prova {
  id: string
  nome: string
  banca: string
  data: string // AAAA-MM-DD
}

export interface Parametros {
  concurso: string
  horasPorDia: number
  diasPorSemana: number
  nivel: NivelExperiencia
  minPorRevisao: number
  ritmoRevisaoHoras: number // 1 revisão a cada N horas
  minPorInedita: number
  minPorErro: number
  metaAcerto: number // 0 a 1
  errosPorDia: number
  tamanhoBloco: number
  espacamentoRevisao: number // posições no ciclo
}

export interface Materia {
  id: string
  nome: string
  entraNoGiro: boolean
  nivel: NivelMateria
  // Metas base (nível Intermediário). O multiplicador do nível ajusta.
  minimo: number
  ideal: number
  maximo: number
  caudaNoIdeal: number
  extraVaiPara: DestinoExtra
}

export interface MarcacaoMateria {
  blocos: boolean[]
  erros: boolean
  revisao: boolean
}

export interface GiroAtual {
  numero: number
  inicio: string // AAAA-MM-DD
  ordem: string[] // ids de matéria, na ordem do ciclo
  marcacoes: Record<string, MarcacaoMateria>
}

export interface GiroFechado {
  numero: number
  inicio: string // '' quando a planilha não registra (giro 1)
  fechamento: string
  totalMaterias: number
  concluidas?: number // matérias com as inéditas do giro feitas
  // Fechados pelo app: questões marcadas no giro e matérias com caderno/revisão.
  feitas?: number
  meta?: number
  materiasComErros?: number
  materiasComRevisao?: number
  // Vindos da aba Histórico da planilha: dias com caderno de erros e com revisão.
  diasErros?: number
  diasRevisao?: number
}

export interface TopicoRevisao {
  id: string
  materia: string
  topico: string
  observacao: string
  incidencia: Incidencia
  acumulado: number | null // 0 a 1
  status: StatusTopico
  recorrente: boolean
  entrouEm?: string // AAAA-MM-DD
  concluidoEm?: string // quando virou Compreendido
  concluidoNoGiro?: number // para a regra "só volta depois de 2 giros"
}

export interface Lembrete {
  id: string
  nome: string
  nota: string
  feito: boolean
}

/** Uma linha da aba Logs Questões. */
export interface LogQuestao {
  id: string
  data: string // AAAA-MM-DD
  materiaId: string
  topico: string // nome do filtro do Tec
  resolvidas: number
  acertos: number
  obs: string
}

/** Aba Erros Tec: foto da última leitura do caderno de erros do Tec Concursos. */
export interface ErrosTec {
  leitura: string // AAAA-MM-DD
  materias: {
    materiaId: string
    noCaderno: number
    pctProva: number | null // peso da matéria na prova (0 a 1); null = sem peso de TI
    recorrentes: number
    acertoRefazer: number | null
  }[]
  topicos: {
    materiaId: string
    topico: string
    noCaderno: number
    refeitasAcertos: number
    refeitasErros: number
    recorrentes: number
    incidencia: Incidencia
  }[]
}

/** 'Ambos' ou '' = cai em todos os concursos; 'Só X' (ou só 'X') = só no concurso X. */
export type ConcursoEdital = string
export interface ItemEdital {
  n: number
  bloco: string // Gerais, Específicos, Discursiva ('' quando importado)
  materiaId: string
  item: string
  edital: ConcursoEdital
}
export type StatusEdital = 'Não visto' | 'Teoria' | 'Questões' | 'Revisado'

export interface EstadoApp {
  versao: 6
  atualizadoEm: string // ISO
  parametros: Parametros
  provas: Prova[]
  materias: Materia[]
  giro: GiroAtual
  historico: GiroFechado[]
  revisao: TopicoRevisao[]
  lembretes: Lembrete[]
  log: LogQuestao[]
  errosTec: ErrosTec
  editalItens: ItemEdital[]
  edital: Record<string, StatusEdital> // nº do item → status (ausente = Não visto)
  horasHoje: { data: string; horas: number } | null
}
