import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Hoje } from './telas/Hoje'
import { Giro } from './telas/Giro'
import { Conta } from './telas/Conta'
import { Registrar } from './telas/Registrar'
import { Painel } from './telas/Painel'
import { RaioX } from './telas/RaioX'
import { Revisao } from './telas/Revisao'
import { Erros } from './telas/Erros'
import { IconeConta, IconeGiro, IconeHoje, IconeMais, IconePainel, IconeRaioX, IconeRegistrar, IconeRevisao, IconeErros } from './componentes/Icones'

interface Tela {
  rota: string
  nome: string
  icone: ReactNode
  elemento: ReactNode
  principal?: boolean // aparece direto na barra do celular
}

const TELAS: Tela[] = [
  { rota: '/', nome: 'Hoje', icone: <IconeHoje />, elemento: <Hoje />, principal: true },
  { rota: '/giro', nome: 'Giro', icone: <IconeGiro />, elemento: <Giro />, principal: true },
  { rota: '/registrar', nome: 'Registrar', icone: <IconeRegistrar />, elemento: <Registrar />, principal: true },
  { rota: '/painel', nome: 'Painel', icone: <IconePainel />, elemento: <Painel />, principal: true },
  { rota: '/raio-x', nome: 'Raio-X', icone: <IconeRaioX />, elemento: <RaioX /> },
  { rota: '/revisao', nome: 'Revisão', icone: <IconeRevisao />, elemento: <Revisao /> },
  { rota: '/erros', nome: 'Erros', icone: <IconeErros />, elemento: <Erros /> },
  { rota: '/conta', nome: 'Conta', icone: <IconeConta />, elemento: <Conta /> },
]

export function App() {
  const [maisAberto, setMaisAberto] = useState(false)
  const local = useLocation()
  useEffect(() => setMaisAberto(false), [local.pathname])
  const classe = ({ isActive }: { isActive: boolean }) => (isActive ? 'ativo' : '')
  const secundarias = TELAS.filter((t) => !t.principal)
  const emSecundaria = secundarias.some((t) => t.rota === local.pathname)

  return (
    <div className="casca">
      <nav className="nav" aria-label="Principal">
        <a className="marca" href="/">
          <img src="/icone.svg" alt="" /> O Buda Concurseiro
        </a>
        {TELAS.map((t) => (
          <NavLink key={t.rota} to={t.rota} end={t.rota === '/'} className={(s) => `${classe(s)}${t.principal ? '' : ' so-largo'}`}>
            {t.icone} {t.nome}
          </NavLink>
        ))}
        <button
          className={`mais so-estreito${emSecundaria || maisAberto ? ' ativo' : ''}`}
          aria-expanded={maisAberto}
          aria-controls="menu-mais"
          onClick={() => setMaisAberto((v) => !v)}
        >
          <IconeMais /> Mais
        </button>
      </nav>

      {maisAberto && (
        <>
          <div className="veu" onClick={() => setMaisAberto(false)} />
          <div id="menu-mais" className="menu-mais" role="menu">
            {secundarias.map((t) => (
              <NavLink key={t.rota} to={t.rota} className={classe} role="menuitem">
                {t.icone} {t.nome}
              </NavLink>
            ))}
          </div>
        </>
      )}

      <main className="conteudo">
        <Routes>
          {TELAS.map((t) => (
            <Route key={t.rota} path={t.rota} element={t.elemento} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
