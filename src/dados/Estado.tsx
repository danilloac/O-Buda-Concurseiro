import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { EstadoApp } from '../dominio/tipos'
import { estadoInicial } from './inicial'
import { migrar } from './migracao'
import { baixarEstado, enviarEstado, supabase } from './supabase'

const CHAVE_LOCAL = 'buda:estado:v1'

function lerLocal(): EstadoApp {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL)
    if (bruto) return migrar(JSON.parse(bruto))
  } catch {
    /* navegador sem armazenamento: segue com o inicial */
  }
  return estadoInicial()
}

function gravarLocal(e: EstadoApp) {
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(e))
  } catch {
    /* ignora */
  }
}

export type Sync = 'local' | 'sincronizando' | 'sincronizado' | 'erro'

interface Contexto {
  estado: EstadoApp
  atualizar: (f: (e: EstadoApp) => EstadoApp) => void
  sessao: Session | null
  sync: Sync
  restaurarInicial: () => void
}

const Ctx = createContext<Contexto | null>(null)

export function ProvedorEstado({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoApp>(lerLocal)
  const [sessao, setSessao] = useState<Session | null>(null)
  const [sync, setSync] = useState<Sync>('local')
  const pronto = useRef(false) // só envia depois de baixar a versão da nuvem
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_ev, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Ao entrar: fica com a versão mais recente (nuvem ou aparelho).
  useEffect(() => {
    pronto.current = false
    if (!sessao) {
      setSync('local')
      return
    }
    setSync('sincronizando')
    baixarEstado(sessao.user.id)
      .then((salvo) => {
        const remoto = salvo ? migrar(salvo) : null
        setEstado((local) => {
          const fica = remoto && remoto.atualizadoEm > local.atualizadoEm ? remoto : local
          gravarLocal(fica)
          if (fica === local) enviarEstado(sessao.user.id, local).catch(() => setSync('erro'))
          return fica
        })
        pronto.current = true
        setSync('sincronizado')
      })
      .catch(() => setSync('erro'))
  }, [sessao])

  const atualizar = useCallback(
    (f: (e: EstadoApp) => EstadoApp) => {
      setEstado((anterior) => {
        const novo = { ...f(anterior), atualizadoEm: new Date().toISOString() }
        gravarLocal(novo)
        if (sessao && pronto.current) {
          window.clearTimeout(timer.current)
          setSync('sincronizando')
          timer.current = window.setTimeout(() => {
            enviarEstado(sessao.user.id, novo)
              .then(() => setSync('sincronizado'))
              .catch(() => setSync('erro'))
          }, 800)
        }
        return novo
      })
    },
    [sessao],
  )

  const restaurarInicial = useCallback(() => atualizar(() => estadoInicial()), [atualizar])

  return <Ctx.Provider value={{ estado, atualizar, sessao, sync, restaurarInicial }}>{children}</Ctx.Provider>
}

export function useEstado() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useEstado fora do ProvedorEstado')
  return c
}
