import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEstado } from '../dados/Estado'
import { entrarComGoogle, sair, supabase } from '../dados/supabase'
import { semanasPorGiro } from '../dominio/giro'

const TEXTO_SYNC = {
  local: 'Salvo só neste aparelho',
  sincronizando: 'Sincronizando…',
  sincronizado: 'Sincronizado com a nuvem',
  erro: 'Não foi possível sincronizar',
} as const

export function Conta() {
  const { estado, sessao, sync, restaurarInicial } = useEstado()
  const [confirmar, setConfirmar] = useState(false)
  const p = estado.parametros
  const semanas = semanasPorGiro(estado)

  return (
    <>
      <header className="topo">
        <h1>Conta</h1>
      </header>

      <section className="cartao conta">
        <h2>Login e sincronização</h2>
        {!supabase ? (
          <p>
            A nuvem ainda não foi configurada. Tudo fica salvo neste navegador. Quando o Supabase estiver ligado, entre
            com o Google para usar o mesmo giro no celular e no computador.
          </p>
        ) : sessao ? (
          <p>Conectado como {sessao.user.email}.</p>
        ) : (
          <p>Entre com sua conta Google para sincronizar o celular e o computador.</p>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`estado-sync ${sync}`}>{TEXTO_SYNC[sync]}</span>
          {supabase &&
            (sessao ? (
              <button className="botao secundario" onClick={() => sair()}>
                Sair
              </button>
            ) : (
              <button className="botao" onClick={() => entrarComGoogle()}>
                Entrar com Google
              </button>
            ))}
        </div>
      </section>

      <section className="cartao conta">
        <h2>Seu plano</h2>
        <p>{p.concurso}</p>
        <div className="resumo">
          <div>
            <b>{p.horasPorDia}h</b>
            <span>por dia, {p.diasPorSemana} dias/semana</span>
          </div>
          <div>
            <b>{p.nivel}</b>
            <span>nível em questões</span>
          </div>
          <div>
            <b>{Math.round(p.metaAcerto * 100)}%</b>
            <span>meta de acerto</span>
          </div>
          <div>
            <b>≈ {semanas.toFixed(1).replace('.', ',')}</b>
            <span>semanas por giro</span>
          </div>
        </div>
        <p className="discreto">
          Para mudar o plano, as matérias, as provas e os lembretes, use a <Link to="/configuracao">Configuração</Link>.
        </p>
      </section>

      <section className="cartao conta">
        <h2>Dados</h2>
        <p>Volta para os dados copiados da planilha em 26/11/2026 (Giro 6).</p>
        {confirmar ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="botao secundario" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
            <button
              className="botao perigo"
              onClick={() => {
                restaurarInicial()
                setConfirmar(false)
              }}
            >
              Restaurar
            </button>
          </div>
        ) : (
          <button className="botao secundario" onClick={() => setConfirmar(true)}>
            Restaurar dados da planilha
          </button>
        )}
      </section>
    </>
  )
}
