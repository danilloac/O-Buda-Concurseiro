import type { EstadoApp } from '../dominio/tipos'
import { MATERIAS, logInicial } from './inicial'
import { errosIniciais } from './erros-inicial'

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
  return e as EstadoApp
}
