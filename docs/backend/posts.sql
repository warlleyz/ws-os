-- PREPARAÇÃO: revisar e aplicar manualmente em um projeto Supabase de teste.
-- Não executado por este trabalho. Não concede escrita aos visitantes.
begin;
create table if not exists public.posts (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,80}$'),
  title jsonb not null,
  summary jsonb not null default '""'::jsonb,
  body jsonb not null,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz
);
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon;
drop policy if exists "public_read_published" on public.posts;
create policy "public_read_published" on public.posts for select to anon
using (status = 'published' and published_at <= now());
commit;
-- Escrever/publicar apenas por SQL administrativo até existir administração autenticada.
-- Conteúdo é texto simples, ou JSON {"pt-BR":"...","en":"..."}; não é HTML.
