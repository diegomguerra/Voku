-- =============================================
-- Client Photos — banco de fotos do cliente
-- =============================================

-- Bucket privado para fotos do cliente
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', false)
on conflict (id) do nothing;

-- RLS: usuário só acessa suas próprias fotos
create policy "Users can upload their own photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'client-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'client-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'client-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Tabela de metadados das fotos
create table if not exists public.client_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null default 0,
  description text,
  created_at timestamptz default now() not null
);

-- RLS
alter table public.client_photos enable row level security;

create policy "Users can view own photos"
  on public.client_photos for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own photos"
  on public.client_photos for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own photos"
  on public.client_photos for delete
  to authenticated
  using (user_id = auth.uid());

-- Index
create index idx_client_photos_user_id on public.client_photos(user_id);
