-- Primeiro passo da nuvem: um documento JSON por pessoa com o estado do app
-- (parâmetros, matérias, giro atual, histórico, fila de revisão e lembretes).
-- Mais tarde o Log de questões ganha tabela própria, para os gráficos e o Raio-X.

create table if not exists public.estado_app (
  user_id uuid primary key references auth.users (id) on delete cascade,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

alter table public.estado_app enable row level security;

-- Projetos novos do Supabase não liberam tabelas criadas por SQL para a API: sem isto a sincronização falha.
grant select, insert, update on public.estado_app to authenticated;

create policy "cada um lê o seu estado"
  on public.estado_app for select
  using (auth.uid() = user_id);

create policy "cada um cria o seu estado"
  on public.estado_app for insert
  with check (auth.uid() = user_id);

create policy "cada um altera o seu estado"
  on public.estado_app for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
