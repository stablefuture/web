-- Application quiz captures more than an email: a name and the quiz answers.
alter table public.leads add column if not exists name text;
alter table public.leads add column if not exists answers jsonb;
