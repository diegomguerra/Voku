create table if not exists revisoes (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  choice_id uuid references choices(id) on delete set null,
  tipos text[],
  descricao text not null,
  arquivos_referencia text[],
  status text default 'pendente',
  created_at timestamptz default now()
);
