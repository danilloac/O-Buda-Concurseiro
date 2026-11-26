# O Buda Concurseiro

App de estudos para concursos (PWA) baseado na planilha do Método do Buda: estudo por **giro**, questões em **blocos de 3** com metas mínimo / ideal / máximo, caderno de erros e revisão espaçada.

Funciona no celular (instala pela tela inicial), no tablet e no computador. Os dados ficam salvos no aparelho e, com login Google, sincronizam pelo Supabase.

## Telas

Hoje, Giro, Registrar (Log de questões), Painel, Raio-X, Revisão, Caderno de erros (Erra × peso), Edital verticalizado (com importação), Histórico dos giros, Configuração (plano, matérias, provas, lembretes e "começar novo concurso") e Conta.

As regras ficam em `src/dominio/*.ts`, com testes que conferem os números com a planilha.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

## Ligar a nuvem (Supabase + Vercel)

1. Crie um projeto grátis em https://supabase.com (região São Paulo).
2. No **SQL Editor**, cole e rode `supabase/migrations/0001_estado_app.sql`.
3. **Login com Google**: no Google Cloud Console, crie um *OAuth Client ID* (tipo Web) com a URL de retorno que o Supabase mostra em **Authentication → Providers → Google**; cole o Client ID e o Secret ali e ative.
4. Na Vercel, importe este repositório (framework Vite) e coloque em **Environment Variables** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (em **Project Settings → API** do Supabase). Faça o deploy.
5. Volte ao Supabase, em **Authentication → URL Configuration**, e coloque a URL da Vercel em *Site URL* e em *Redirect URLs*.
6. Abra o app, entre com o Google em **Conta** no computador e no celular.

Sem essas variáveis o app funciona, só que salva apenas no navegador. Para rodar local, copie `.env.example` para `.env.local` com as mesmas variáveis.

## Leitura do Tec

A skill que lê as estatísticas do Tec pelo Chrome, depois de gravar na planilha, abre o app numa aba do mesmo Chrome e chama:

```js
window.budaTec.situacao()   // { pronto, logado, sync, ultimaLeitura, registros }
window.budaTec.importar({
  lote: '2026-11-27T21:00',         // identifica a leitura; repetir não duplica
  leitura: '2026-11-27',
  questoes: [['Banco de Dados', 'Oracle', 6, 4]],      // matéria, tópico, resolvidas, acertos
  erros: { linhas: [['Banco de Dados', 'PostgreSQL', 8, 4, 3, 2]] }, // matéria, tópico, no caderno, refeitas acertos, refeitas erros, recorrentes
})
```

As questões entram no Log, o caderno de erros é trocado pela fotografia nova (em partes: `substituir: false` a partir da segunda, com lotes `x#1`, `x#2`...) e, com login, tudo sincroniza com o celular. O mesmo JSON pode ser colado à mão no fim da tela Erros.
