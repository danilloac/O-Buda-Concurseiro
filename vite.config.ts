import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg'],
      manifest: {
        name: 'O Buda Concurseiro',
        short_name: 'Buda',
        description: 'Giro de estudos para concursos: plano do dia, blocos de questões e revisão.',
        lang: 'pt-BR',
        theme_color: '#1f1b3a',
        background_color: '#faf7f2',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
})
