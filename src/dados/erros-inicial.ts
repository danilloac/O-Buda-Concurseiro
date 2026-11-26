import type { ErrosTec } from '../dominio/tipos'

// Aba Erros Tec da planilha, leitura de 26/11/2026.
// Por tópico: só os tópicos de incidência Moderada ou maior com sinal de alerta
// (recorrentes ou acerto abaixo de 75%); a próxima leitura do Tec traz a lista completa.
const t = (
  materiaId: string,
  topico: string,
  noCaderno: number,
  refeitasAcertos: number,
  refeitasErros: number,
  recorrentes: number,
  incidencia: ErrosTec['topicos'][number]['incidencia'],
) => ({ materiaId, topico, noCaderno, refeitasAcertos, refeitasErros, recorrentes, incidencia })

export function errosIniciais(): ErrosTec {
  return {
    leitura: '2026-11-26',
    materias: [
      { materiaId: 'dev-sistemas', noCaderno: 75, pctProva: 0.2, recorrentes: 3, acertoRefazer: 0.7 },
      { materiaId: 'redes', noCaderno: 37, pctProva: 0.16, recorrentes: 2, acertoRefazer: 0.71 },
      { materiaId: 'seguranca', noCaderno: 32, pctProva: 0.15, recorrentes: 2, acertoRefazer: 0.59 },
      { materiaId: 'governanca', noCaderno: 25, pctProva: 0.14, recorrentes: 1, acertoRefazer: 0.83 },
      { materiaId: 'eng-software', noCaderno: 39, pctProva: 0.1, recorrentes: 7, acertoRefazer: 0.7 },
      { materiaId: 'banco-dados', noCaderno: 39, pctProva: 0.1, recorrentes: 3, acertoRefazer: 0.83 },
      { materiaId: 'ciencia-dados', noCaderno: 34, pctProva: 0.09, recorrentes: 4, acertoRefazer: 0.67 },
      { materiaId: 'sistemas-op', noCaderno: 42, pctProva: 0.06, recorrentes: 2, acertoRefazer: 0.68 },
      { materiaId: 'portugues', noCaderno: 21, pctProva: null, recorrentes: 1, acertoRefazer: 0.82 },
    ],
    topicos: [
      t('portugues', 'Conjunção', 4, 3, 1, 1, ''),
      t('banco-dados', 'PL/SQL e Outras Extensões SQL', 5, 4, 1, 1, 'Moderada'),
      t('banco-dados', 'PostgreSQL', 8, 4, 3, 2, 'Alta'),
      t('banco-dados', 'Oracle', 7, 6, 0, 0, 'Alta'),
      t('banco-dados', 'Modelo Entidade-Relacionamento (MER)', 5, 3, 2, 0, 'Moderada'),
      t('ciencia-dados', 'Ferramentas de Análise de Dados e Observabilidade (Elastic Search, Kibana, Grafana, etc.)', 5, 2, 3, 2, 'Alta'),
      t('ciencia-dados', 'Conceitos Gerais de Machine Learning', 6, 3, 1, 2, 'Alta'),
      t('ciencia-dados', 'Python (Conceitos Gerais e Códigos)', 4, 2, 2, 0, 'Moderada'),
      t('ciencia-dados', 'ETL (Extração, Transformação e Carga)', 4, 2, 1, 0, 'Moderada'),
      t('dev-sistemas', 'Javascript', 4, 2, 2, 1, 'Moderada'),
      t('dev-sistemas', 'JPA (Java Persistence API)', 9, 6, 2, 1, 'Moderada'),
      t('dev-sistemas', 'Framework Spring', 18, 11, 3, 0, 'Alta'),
      t('dev-sistemas', 'Códigos em Java', 6, 2, 3, 0, 'Moderada'),
      t('dev-sistemas', 'XML', 6, 4, 1, 0, 'Moderada'),
      t('eng-software', 'SCRUM', 4, 3, 1, 1, 'Alta'),
      t('eng-software', 'UML', 7, 5, 2, 1, 'Alta'),
      t('eng-software', 'Padrões de Projeto (Engenharia de Software)', 6, 2, 4, 2, 'Alta'),
      t('eng-software', 'Conceitos e Tipos de Testes de Software', 3, 2, 1, 1, 'Alta'),
      t('eng-software', 'Git', 5, 2, 2, 2, 'Alta'),
      t('governanca', 'COBIT 2019', 4, 3, 1, 1, 'Alta'),
      t('governanca', 'Diagrama de Redes, PERT, CPM e MDP', 8, 7, 1, 0, 'Alta'),
      t('governanca', 'MPS.BR', 3, 1, 0, 0, 'Alta'),
      t('governanca', 'ITIL v4', 3, 2, 0, 0, 'Altíssima'),
      t('redes', 'Máscara e Endereçamento IP', 9, 4, 4, 1, 'Alta'),
      t('redes', 'Protocolo SNMP, sua Extensão RMON e a Base de Informações MIB', 6, 3, 2, 1, 'Moderada'),
      t('redes', 'Cabeamento e Meios de Transmissão', 2, 1, 1, 0, 'Alta'),
      t('redes', 'Cloud Computing (Computação em Nuvem)', 3, 3, 0, 0, 'Alta'),
      t('seguranca', 'Riscos em Segurança da Informação (NBR ISO/IEC 27001, 27002 e 27005)', 2, 0, 2, 1, 'Moderada'),
      t('seguranca', 'Conceitos de Firewall, Proxy e DMZ', 9, 4, 2, 0, 'Moderada'),
      t('banco-dados', 'Versionamento e Migração de Banco de Dados', 1, 1, 0, 0, 'Baixa'),
    ],
  }
}
