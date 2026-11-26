import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Hoje } from './telas/Hoje'
import { Giro } from './telas/Giro'
import { Conta } from './telas/Conta'
import { Registrar } from './telas/Registrar'
import { IconeConta, IconeGiro, IconeHoje, IconeRegistrar } from './componentes/Icones'

export function App() {
  const classe = ({ isActive }: { isActive: boolean }) => (isActive ? 'ativo' : '')
  return (
    <div className="casca">
      <nav className="nav" aria-label="Principal">
        <a className="marca" href="/">
          <img src="/icone.svg" alt="" /> O Buda Concurseiro
        </a>
        <NavLink to="/" end className={classe}>
          <IconeHoje /> Hoje
        </NavLink>
        <NavLink to="/giro" className={classe}>
          <IconeGiro /> Giro
        </NavLink>
        <NavLink to="/registrar" className={classe}>
          <IconeRegistrar /> Registrar
        </NavLink>
        <NavLink to="/conta" className={classe}>
          <IconeConta /> Conta
        </NavLink>
      </nav>
      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Hoje />} />
          <Route path="/giro" element={<Giro />} />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
