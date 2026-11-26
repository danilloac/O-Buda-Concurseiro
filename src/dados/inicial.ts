import type { EstadoApp, LogQuestao, Materia, MarcacaoMateria, TopicoRevisao } from '../dominio/tipos'
import logBruto from './log-inicial.json'
import { errosIniciais } from './erros-inicial'

// Dados iniciais copiados da planilha "TRT 8 e 4" em 26/11/2026
// (abas Formulário inicial, Configuração inicial, Diário, Revisão e Logs Questões).

const m = (
  id: string,
  nome: string,
  nivel: Materia['nivel'],
  metas: [number, number, number, number] | null,
  extraVaiPara: Materia['extraVaiPara'] = 'Núcleo',
): Materia => ({
  id,
  nome,
  nivel,
  entraNoGiro: metas !== null,
  minimo: metas?.[0] ?? 0,
  ideal: metas?.[1] ?? 0,
  maximo: metas?.[2] ?? 0,
  caudaNoIdeal: metas?.[3] ?? 0,
  extraVaiPara,
})

export const MATERIAS: Materia[] = [
  m('portugues', 'Português', 'Dificuldade', [9, 15, 21, 0], 'Caderno único'),
  m('eng-software', 'Engenharia de Software', 'Facilidade', [9, 15, 21, 3]),
  m('dev-sistemas', 'Dev. Sistemas', 'Dificuldade', [15, 21, 30, 0]),
  m('governanca', 'Governança de TI', 'Facilidade', [6, 9, 18, 0]),
  m('redes', 'Redes', 'Dificuldade', [12, 15, 24, 0]),
  m('ingles', 'Inglês Técnico', 'Dificuldade', [6, 9, 12, 0], 'Caderno único'),
  m('rlm', 'RLM', 'Facilidade', [6, 6, 9, 0], 'Caderno único'),
  m('sistemas-op', 'Sistemas Operacionais', 'Dificuldade', [6, 15, 21, 0]),
  m('ciencia-dados', 'Ciência de Dados & IA', 'Dificuldade', [9, 9, 18, 0], 'Cauda'),
  m('banco-dados', 'Banco de Dados', 'Facilidade', [9, 15, 21, 3]),
  m('seguranca', 'Segurança da Informação', 'Dificuldade', [9, 15, 24, 0]),
  m('dir-adm', 'Direito Administrativo', 'Lei seca', null),
  m('dir-const', 'Direito Constitucional', 'Lei seca', null),
  m('pcd', 'Direitos das Pessoas com Deficiência', 'Lei seca', null),
  m('dir-humanos', 'Direitos Humanos', 'Lei seca', null),
  m('legislacao-trt', 'Legislação TRT 8 e TRT 4', 'Lei seca', null),
  m('pdpj', 'Normativos PDPJ-Br', 'Lei seca', null),
  m('redacao', 'Redação (discursiva)', 'Lei seca', null),
]

const marc = (feitos: number, total: number, erros: boolean, revisao = true): MarcacaoMateria => ({
  blocos: Array.from({ length: total }, (_, i) => i < feitos),
  erros,
  revisao,
})

const t = (
  id: string,
  materia: string,
  topico: string,
  observacao: string,
  incidencia: TopicoRevisao['incidencia'],
  acumulado: number,
  status: TopicoRevisao['status'],
  recorrente = false,
): TopicoRevisao => ({ id, materia, topico, observacao, incidencia, acumulado, status, recorrente, entrouEm: '2026-11-24' })

/** Logs Questões: 369 linhas, 979 questões, 660 acertos. */
export function logInicial(): LogQuestao[] {
  return (logBruto as [string, string, string, number, number][]).map(([data, materiaId, topico, resolvidas, acertos], i) => ({
    id: `p${i + 1}`,
    data,
    materiaId,
    topico,
    resolvidas,
    acertos,
    obs: '',
  }))
}

export function estadoInicial(): EstadoApp {
  return {
    versao: 4,
    atualizadoEm: new Date(0).toISOString(),
    parametros: {
      concurso: 'TRT 8 e TRT 4 — Analista Judiciário, área TI (FCC)',
      horasPorDia: 2,
      diasPorSemana: 6,
      nivel: 'Intermediário',
      minPorRevisao: 30,
      ritmoRevisaoHoras: 1.5,
      minPorInedita: 7,
      minPorErro: 1.5,
      metaAcerto: 0.8,
      errosPorDia: 10,
      tamanhoBloco: 3,
      espacamentoRevisao: 5,
    },
    provas: [
      { id: 'trt8', nome: 'TRT 8', banca: 'FCC', data: '2027-01-17' },
      { id: 'tjpb', nome: 'TJPB', banca: 'FGV', data: '2027-01-24' },
      { id: 'trt4', nome: 'TRT 4', banca: 'FCC', data: '2027-01-31' },
    ],
    materias: MATERIAS,
    giro: {
      numero: 6,
      inicio: '2026-11-21',
      ordem: MATERIAS.filter((x) => x.entraNoGiro).map((x) => x.id),
      marcacoes: {
        portugues: marc(7, 7, true),
        'eng-software': marc(7, 7, true),
        'dev-sistemas': marc(10, 10, true),
        governanca: marc(6, 6, true),
        redes: marc(5, 8, true),
        ingles: marc(4, 4, true),
        rlm: marc(3, 3, true),
        'sistemas-op': marc(2, 7, false),
        'ciencia-dados': marc(3, 6, false),
        'banco-dados': marc(0, 7, false),
        seguranca: marc(0, 8, false),
      },
    },
    historico: [],
    revisao: [
      t('r1', 'Sistemas Operacionais', 'Unix e Linux', 'GRAN', 'Altíssima', 0.4, 'Parcialmente compreendido'),
      t('r2', 'Sistemas Operacionais', 'Windows Powershell e Prompt de Comando', '', 'Alta', 0.38, 'Não compreendido'),
      t('r3', 'Redes', 'Máscara e Endereçamento IP', 'Youtube', 'Alta', 0.62, 'Parcialmente compreendido', true),
      t('r4', 'Banco de Dados', 'Oracle', 'GRAN - Aula 01', 'Alta', 0.5, 'Não compreendido'),
      t('r5', 'Banco de Dados', 'PostgreSQL', '', 'Alta', 0.63, 'Não compreendido', true),
      t('r6', 'Dev. Sistemas', 'Framework Spring', 'GRAN - Aula 01', 'Alta', 0.58, 'Não compreendido'),
      t('r7', 'Segurança da Informação', 'Protocolos seguros para redes sem fio (WPA, WPA2, WEP, EAP, 802.1X)', 'Youtube', 'Moderada', 0.11, 'Parcialmente compreendido', true),
      t('r8', 'Ciência de Dados & IA', 'Pandas', 'GRAN - Aula 01', 'Moderada', 0.33, 'Parcialmente compreendido'),
      t('r9', 'Sistemas Operacionais', 'Linux', '', 'Moderada', 0.38, 'Não compreendido', true),
      t('r10', 'Segurança da Informação', 'Conceitos de Firewall, Proxy e DMZ', '', 'Moderada', 0.64, 'Não compreendido'),
      t('r11', 'Dev. Sistemas', 'JPA (Java Persistence API)', '', 'Moderada', 0.67, 'Não compreendido', true),
      t('r12', 'Português', 'Concordância (Verbal e Nominal)', 'Youtube 32min', '', 0.33, 'Parcialmente compreendido'),
      t('r13', 'Banco de Dados', 'Consultas e Comandos em SQL', '', '', 0.67, 'Não compreendido'),
    ],
    lembretes: [
      { id: 'redacao', nome: 'Redação', nota: 'Semanal', feito: false },
      { id: 'erros-rec', nome: 'Erros recorrentes', nota: 'Caderno do Tec', feito: false },
      { id: 'dir-const', nome: 'Direito Constitucional', nota: 'Áudio 04', feito: true },
      { id: 'dir-adm', nome: 'Direito Administrativo', nota: 'Áudio 02', feito: false },
      { id: 'dir-humanos', nome: 'Direitos Humanos', nota: 'Áudio 02', feito: false },
      { id: 'regimento', nome: 'Regimento Interno', nota: 'Áudio 02', feito: false },
      { id: 'cnj', nome: 'Normativos / Resolução CNJ', nota: 'Tudo', feito: false },
      { id: 'sustentabilidade', nome: 'Sustentabilidade', nota: 'Tudo', feito: false },
      { id: 'pcd', nome: 'Direitos das Pessoas com Deficiência', nota: '', feito: false },
    ],
    log: logInicial(),
    errosTec: errosIniciais(),
    edital: {},
    horasHoje: null,
  }
}
