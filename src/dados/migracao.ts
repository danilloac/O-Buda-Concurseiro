import type { EstadoApp } from '../dominio/tipos'
import { MATERIAS, historicoInicial, logInicial } from './inicial'
import { errosIniciais } from './erros-inicial'
import { EDITAL } from './edital'

/** Atualiza um estado salvo por uma versão anterior do app. */
export function migrar(bruto: unknown): EstadoApp {
  let e = bruto as Omit<Partial<EstadoApp>, 'versao'> & { versao?: number }
  if (!e.versao || e.versao < 2) {
    // v1 não tinha o Log: entra o Log copiado da planilha.
    e = { ...e, versao: 2, log: e.log ?? logInicial() }
  }
  if (e.versao! < 3) {
    // v2 não tinha o caderno de erros do Tec.
    e = { ...e, versao: 3, errosTec: e.errosTec ?? errosIniciais() }
  }
  if (e.versao! < 4) {
    // v3 não tinha o edital verticalizado nem a matéria Redação.
    const materias = e.materias ?? []
    e = {
      ...e,
      versao: 4,
      edital: e.edital ?? {},
      materias: materias.some((x) => x.id === 'redacao') ? materias : [...materias, ...MATERIAS.filter((x) => x.id === 'redacao')],
    }
  }
  if (e.versao! < 5) {
    // v4 começava com o histórico vazio: entram os giros 1 a 5 da planilha que faltarem.
    const atual = e.historico ?? []
    const numeros = new Set(atual.map((g) => g.numero))
    const faltam = historicoInicial().filter((g) => !numeros.has(g.numero) && g.numero < (e.giro?.numero ?? 6))
    e = { ...e, versao: 5, historico: [...faltam, ...atual].sort((a, b) => a.numero - b.numero) }
  }
  if (e.versao! < 6) {
    // v5 tinha o edital fixo no código: passa a ficar nos dados, para poder importar outro.
    e = { ...e, versao: 6, editalItens: e.editalItens ?? EDITAL }
  }
  if (e.versao! < 7) {
    // v6 não recebia a leitura do Tec direto no app.
    e = { ...e, versao: 7, importacoes: e.importacoes ?? [] }
  }
  return e as EstadoApp
}
