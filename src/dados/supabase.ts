import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { EstadoApp } from '../dominio/tipos'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Null quando o projeto não tem Supabase configurado: o app roda só local. */
export const supabase: SupabaseClient | null = url && chave ? createClient(url, chave) : null

export async function entrarComGoogle() {
  if (!supabase) return
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

export async function sair() {
  await supabase?.auth.signOut()
}

export async function baixarEstado(userId: string): Promise<EstadoApp | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('estado_app')
    .select('dados')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.dados as EstadoApp | undefined) ?? null
}

export async function enviarEstado(userId: string, estado: EstadoApp) {
  if (!supabase) return
  const { error } = await supabase
    .from('estado_app')
    .upsert({ user_id: userId, dados: estado, atualizado_em: estado.atualizadoEm })
  if (error) throw error
}
