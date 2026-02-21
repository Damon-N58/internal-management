-- ============================================================
-- Migration: Auth, Tickets, To-Dos, Google Drive
-- Run this in the Supabase SQL Editor BEFORE deploying the new code
--
-- NOTE: Existing tables (company, ticket, etc.) use TEXT ids from
-- Prisma's cuid(). New tables referencing them must also use TEXT.
-- ============================================================

-- 1. Profile table (mirrors auth.users)
create table if not exists public.profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'Member' check (role in ('Admin', 'Manager', 'Member')),
  created_at timestamptz not null default now()
);

-- Auto-create profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profile (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. User ↔ Company assignment junction table
-- company.id is TEXT (Prisma cuid), so company_id must also be TEXT
create table if not exists public.user_company_assignment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(id) on delete cascade,
  company_id text not null references public.company(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, company_id)
);

create index if not exists idx_uca_user on public.user_company_assignment(user_id);
create index if not exists idx_uca_company on public.user_company_assignment(company_id);

-- 3. Expand ticket table
-- assigned_to references profile (uuid), that's fine
alter table public.ticket
  add column if not exists description text,
  add column if not exists assigned_to uuid references public.profile(id) on delete set null,
  add column if not exists priority int not null default 3,
  add column if not exists due_date date;

-- Add check constraint separately (add column if not exists + check in one statement can fail)
do $$ begin
  alter table public.ticket add constraint ticket_priority_check check (priority between 1 and 5);
exception when duplicate_object then null;
end $$;

-- 4. Ticket comments table
-- ticket.id is TEXT (Prisma cuid), so ticket_id must be TEXT
create table if not exists public.ticket_comment (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null references public.ticket(id) on delete cascade,
  author_id uuid not null references public.profile(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tc_ticket on public.ticket_comment(ticket_id);

-- 5. To-do table
create table if not exists public.todo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(id) on delete cascade,
  text text not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_todo_user on public.todo(user_id);

-- 6. Google Drive URL on company
alter table public.company
  add column if not exists google_drive_url text;

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.profile enable row level security;
alter table public.user_company_assignment enable row level security;
alter table public.todo enable row level security;
alter table public.ticket_comment enable row level security;

-- Profile: anyone authenticated can read all profiles, users can update their own
create policy "profiles_select" on public.profile for select to authenticated using (true);
create policy "profiles_update_own" on public.profile for update to authenticated using (id = auth.uid());

-- User-company assignments: authenticated users can read all, admins can insert/delete
create policy "uca_select" on public.user_company_assignment for select to authenticated using (true);
create policy "uca_insert_admin" on public.user_company_assignment for insert to authenticated
  with check (exists (select 1 from public.profile where id = auth.uid() and role = 'Admin'));
create policy "uca_delete_admin" on public.user_company_assignment for delete to authenticated
  using (exists (select 1 from public.profile where id = auth.uid() and role = 'Admin'));

-- To-do: users can only see/manage their own
create policy "todo_select_own" on public.todo for select to authenticated using (user_id = auth.uid());
create policy "todo_insert_own" on public.todo for insert to authenticated with check (user_id = auth.uid());
create policy "todo_update_own" on public.todo for update to authenticated using (user_id = auth.uid());
create policy "todo_delete_own" on public.todo for delete to authenticated using (user_id = auth.uid());

-- Ticket comments: authenticated users can read all, insert their own
create policy "tc_select" on public.ticket_comment for select to authenticated using (true);
create policy "tc_insert" on public.ticket_comment for insert to authenticated
  with check (author_id = auth.uid());
