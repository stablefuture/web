create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'guide',
  created_at timestamptz not null default now()
);

-- Prevent duplicate emails from the same source
create unique index if not exists leads_email_source_idx on public.leads (email, source);

-- RLS: service role can insert; no public read
alter table public.leads enable row level security;

create policy "service role insert" on public.leads
  for insert
  to service_role
  with check (true);
