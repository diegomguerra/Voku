-- Paleta de cores por projeto
alter table orders add column if not exists paleta_cores jsonb default '[]';
alter table orders add column if not exists atribuicoes_cores jsonb default '{}';

-- Paleta global da marca do cliente (persistente entre projetos)
create table if not exists marca_paleta (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  cores jsonb not null default '[]',
  updated_at timestamptz default now()
);
