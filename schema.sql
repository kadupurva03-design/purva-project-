-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  email text default (auth.jwt() ->> 'email'),
  title text not null,
  course text,
  due timestamptz not null,
  priority text default 'Normal',
  done boolean default false,
  sent text[] default '{}',
  created_at timestamptz default now()
);
alter table assignments enable row level security;
create policy "own rows only" on assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
