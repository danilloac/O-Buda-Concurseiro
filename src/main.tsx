import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { ProvedorEstado } from './dados/Estado'
import { App } from './App'
import './estilo.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorEstado>
        <App />
      </ProvedorEstado>
    </BrowserRouter>
  </StrictMode>,
)
