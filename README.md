# O Buda Concurseiro

App de estudos para concursos (PWA) baseado na planilha do Método do Buda: estudo por **giro**, questões em **blocos de 3** com metas mínimo / ideal / máximo, caderno de erros e revisão espaçada.

Funciona no celular (instala pela tela inicial), no tablet e no computador. Os dados ficam salvos no aparelho e, com login Google, sincronizam pelo Supabase.

## O que já existe

- **Hoje**: contagem regressiva das provas, horas de hoje e o plano do dia (caderno de erros, revisões com os tópicos da fila e inéditas a partir da próxima matéria), progresso do giro e lembretes.
- **Giro**: matérias na ordem do ciclo, blocos clicáveis coloridos por faixa (mínimo, ideal, cauda, extra), status, checks de erros e de revisão (matéria 5 posições antes), reordenar e fechar giro com histórico.
- **Conta**: login Google, estado da sincronização e restaurar os dados da planilha.

As regras estão em `src/dominio/giro.ts` e os testes em `src/dominio/giro.test.ts` conferem os números com o Diário da planilha (9 de 11 matérias, 141 de 144 questões, 15 inéditas com 3 horas).

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

## Ligar a nuvem (Supabase + Vercel)

1. Crie um projeto grátis em https://supabase.com.
2. No **SQL Editor**, rode `supabase/migrations/0001_estado_app.sql`.
3. Em **Authentication → Providers**, ative **Google** (precisa de um Client ID do Google Cloud) e, em **URL Configuration**, adicione a URL do app (ex.: `https://seu-app.vercel.app`).
4. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (em **Project Settings → API**).
5. Na Vercel, importe este repositório (framework Vite) e coloque as mesmas duas variáveis em **Environment Variables**.

Sem essas variáveis o app funciona normalmente, só que salva apenas no navegador.

## Próximas telas

Registrar questões (Log), Painel com gráficos, Raio-X, fila de Revisão, Caderno de erros (Erra × peso), Edital verticalizado e Configuração das matérias.
