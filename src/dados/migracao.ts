import type { EstadoApp } from '../dominio/tipos'
import { logInicial } from './inicial'

/** Atualiza um estado salvo por uma versão anterior do app. */
export function migrar(bruto: unknown): EstadoApp {
  const e = bruto as Partial<EstadoApp> & { versao?: number }
  if (!e.versao || e.versao < 2) {
    // v1 não tinha o Log: entra o Log copiado da planilha.
    return { ...(e as EstadoApp), versao: 2, log: e.log ?? logInicial() }
  }
  return e as EstadoApp
}
