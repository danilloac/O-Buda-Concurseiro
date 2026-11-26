import { idDoNome } from './config'
import { materiaPeloNome } from './edital'
import type { ErrosTec, EstadoApp, LogQuestao, Materia } from './tipos'

/**
 * O que a leitura do Tec manda para o app (mesmos números que ela grava na planilha).
 * - questoes: o que foi feito desde a última leitura, como no Logs Questões.
 * - erros: fotografia do caderno de erros e dos recorrentes, como na aba Erros Tec.
 *   Pode vir em partes: a primeira com substituir: true, as seguintes com false.
 */
export interface LeituraTec {
  lote: string // identifica a leitura; repetir o mesmo lote não duplica nada
  leitura: string // AAAA-MM-DD
  questoes?: ([string, string, number, number] | { data?: string; materia: string; topico: string; resolvidas: number; acertos: number })[]
  erros?: { linhas: [string, string, number, number, number, number][]; substituir?: boolean }
}

export interface ResumoImportacao {
  ok: boolean
  repetido?: boolean
  erro?: string
  questoes: number
  resolvidas: number
  acertos: number
  topicosErros: number
  materiasNovas: string[]
}

const DATA = /^\d{4}-\d{2}-\d{2}$/
const inteiro = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null)

/** Confere o formato antes de mexer no estado. Devolve a mensagem do primeiro problema. */
export function validarLeituraTec(d: unknown): string | null {
  if (!d || typeof d !== 'object') return 'Envie um objeto com lote e leitura.'
  const x = d as Partial<LeituraTec>
  if (!x.lote || typeof x.lote !== 'string') return 'Falta o lote (um texto que identifica a leitura).'
  if (!x.leitura || !DATA.test(x.leitura)) return 'A leitura precisa ser uma data AAAA-MM-DD.'
  for (const [i, q] of (x.questoes ?? []).entries()) {
    const [materia, topico, resolvidas, acertos] = Array.isArray(q) ? q : [q.materia, q.topico, q.resolvidas, q.acertos]
    if (!materia || typeof materia !== 'string' || typeof topico !== 'string') return `Questão ${i + 1}: falta matéria ou tópico.`
    const r = inteiro(resolvidas)
    const a = inteiro(acertos)
    if (r === null || a === null || r === 0 || a > r) return `Questão ${i + 1}: resolvidas e acertos inválidos.`
    if (!Array.isArray(q) && q.data && !DATA.test(q.data)) return `Questão ${i + 1}: data inválida.`
  }
  for (const [i, l] of (x.erros?.linhas ?? []).entries()) {
    if (!Array.isArray(l) || l.length < 6 || typeof l[0] !== 'string' || typeof l[1] !== 'string' || l.slice(2, 6).some((v) => inteiro(v) === null))
      return `Linha ${i + 1} dos erros: use [matéria, tópico, no caderno, refeitas acertos, refeitas erros, recorrentes].`
  }
  return null
}

/** Soma os tópicos por matéria, mantendo o peso na prova que já estava cadastrado. */
function materiasDosErros(topicos: ErrosTec['topicos'], antes: ErrosTec['materias']): ErrosTec['materias'] {
  const m = new Map<string, { noCaderno: number; recorrentes: number; ra: number; re: number }>()
  for (const t of topicos) {
    const g = m.get(t.materiaId) ?? { noCaderno: 0, recorrentes: 0, ra: 0, re: 0 }
    g.noCaderno += t.noCaderno
    g.recorrentes += t.recorrentes
    g.ra += t.refeitasAcertos
    g.re += t.refeitasErros
    m.set(t.materiaId, g)
  }
  return [...m].map(([materiaId, g]) => ({
    materiaId,
    noCaderno: g.noCaderno,
    pctProva: antes.find((x) => x.materiaId === materiaId)?.pctProva ?? null,
    recorrentes: g.recorrentes,
    acertoRefazer: g.ra + g.re ? g.ra / (g.ra + g.re) : null,
  }))
}

export function aplicarLeituraTec(e: EstadoApp, d: LeituraTec): { estado: EstadoApp; resumo: ResumoImportacao } {
  const vazio: ResumoImportacao = { ok: false, questoes: 0, resolvidas: 0, acertos: 0, topicosErros: 0, materiasNovas: [] }
  const erro = validarLeituraTec(d)
  if (erro) return { estado: e, resumo: { ...vazio, erro } }
  // Uma leitura em partes usa lotes "x#1", "x#2"...: cada parte conta uma vez.
  if (e.importacoes.includes(d.lote)) return { estado: e, resumo: { ...vazio, ok: true, repetido: true } }

  const materias: Materia[] = [...e.materias]
  const novas: string[] = []
  const idDe = (nome: string) => {
    const m = materiaPeloNome(materias, nome)
    if (m) return m.id
    const id = idDoNome(nome, materias.map((x) => x.id))
    // Matéria que só existe no Tec: entra fora do giro, para não perder o registro.
    materias.push({ id, nome: nome.trim(), entraNoGiro: false, nivel: 'Dificuldade', minimo: 0, ideal: 0, maximo: 0, caudaNoIdeal: 0, extraVaiPara: 'Núcleo' })
    novas.push(nome.trim())
    return id
  }

  const linhas: LogQuestao[] = (d.questoes ?? []).map((q, i) => {
    const o = Array.isArray(q) ? { materia: q[0], topico: q[1], resolvidas: q[2], acertos: q[3] } : q
    return {
      id: `tec-${d.lote}-${i + 1}`,
      data: ('data' in o && o.data) || d.leitura,
      materiaId: idDe(o.materia),
      topico: o.topico.trim(),
      resolvidas: o.resolvidas,
      acertos: o.acertos,
      obs: 'Tec',
    }
  })

  let errosTec = e.errosTec
  if (d.erros) {
    const incidencia = new Map(e.errosTec.topicos.map((t) => [`${t.materiaId}|${t.topico}`, t.incidencia]))
    const novos = d.erros.linhas.map(([materia, topico, noCaderno, refeitasAcertos, refeitasErros, recorrentes]) => {
      const materiaId = idDe(materia)
      const nome = topico.replace(/\s+/g, ' ').trim()
      return { materiaId, topico: nome, noCaderno, refeitasAcertos, refeitasErros, recorrentes, incidencia: incidencia.get(`${materiaId}|${nome}`) ?? '' }
    })
    const topicos = d.erros.substituir === false ? [...e.errosTec.topicos, ...novos] : novos
    errosTec = { leitura: d.leitura, topicos, materias: materiasDosErros(topicos, e.errosTec.materias) }
  }

  const estado: EstadoApp = {
    ...e,
    materias,
    log: [...e.log, ...linhas],
    errosTec,
    importacoes: [...e.importacoes, d.lote].slice(-100),
  }
  return {
    estado,
    resumo: {
      ok: true,
      questoes: linhas.length,
      resolvidas: linhas.reduce((s, l) => s + l.resolvidas, 0),
      acertos: linhas.reduce((s, l) => s + l.acertos, 0),
      topicosErros: d.erros?.linhas.length ?? 0,
      materiasNovas: novas,
    },
  }
}
