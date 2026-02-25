-- ============================================================
-- Migration: Switch from Supabase Auth to Clerk
-- Clerk user IDs are text strings (user_xxx), not UUIDs.
-- Must change profile.id and all FK references from uuid to text.
-- Run this in the Supabase SQL Editor BEFORE deploying the new code.
-- ============================================================

-- 1. Drop the auto-create trigger (no longer needed — app code syncs profiles)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Drop RLS policies that reference auth.uid()
DROP POLICY IF EXISTS "profiles_select" ON public.profile;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profile;
DROP POLICY IF EXISTS "uca_select" ON public.user_company_assignment;
DROP POLICY IF EXISTS "uca_insert_admin" ON public.user_company_assignment;
DROP POLICY IF EXISTS "uca_delete_admin" ON public.user_company_assignment;
DROP POLICY IF EXISTS "todo_select_own" ON public.todo;
DROP POLICY IF EXISTS "todo_insert_own" ON public.todo;
DROP POLICY IF EXISTS "todo_update_own" ON public.todo;
DROP POLICY IF EXISTS "todo_delete_own" ON public.todo;
DROP POLICY IF EXISTS "tc_select" ON public.ticket_comment;
DROP POLICY IF EXISTS "tc_insert" ON public.ticket_comment;

-- 3. Disable RLS on affected tables (service role bypasses anyway)
ALTER TABLE public.profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_assignment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comment DISABLE ROW LEVEL SECURITY;

-- 4. Drop FK constraints
ALTER TABLE public.profile DROP CONSTRAINT IF EXISTS profile_pkey CASCADE;
ALTER TABLE public.user_company_assignment DROP CONSTRAINT IF EXISTS uca_user_id_fkey;
ALTER TABLE public.ticket_comment DROP CONSTRAINT IF EXISTS ticket_comment_author_id_fkey;
ALTER TABLE public.todo DROP CONSTRAINT IF EXISTS todo_user_id_fkey;

-- 5. Change column types from uuid to text
ALTER TABLE public.profile ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.user_company_assignment ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.ticket_comment ALTER COLUMN author_id TYPE text USING author_id::text;
ALTER TABLE public.todo ALTER COLUMN user_id TYPE text USING user_id::text;

-- Also change ticket.assigned_to from uuid to text
ALTER TABLE public.ticket ALTER COLUMN assigned_to TYPE text USING assigned_to::text;

-- 6. Re-add primary key and foreign keys
ALTER TABLE public.profile ADD PRIMARY KEY (id);

ALTER TABLE public.user_company_assignment
  ADD CONSTRAINT uca_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profile(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_comment
  ADD CONSTRAINT ticket_comment_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profile(id) ON DELETE CASCADE;

ALTER TABLE public.todo
  ADD CONSTRAINT todo_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profile(id) ON DELETE CASCADE;

-- 7. Re-add unique constraint on user_company_assignment
-- (CASCADE may have dropped it)
DO $$ BEGIN
  ALTER TABLE public.user_company_assignment ADD CONSTRAINT user_company_assignment_user_id_company_id_key UNIQUE (user_id, company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. Clear existing auth-linked data (fresh start with Clerk users)
TRUNCATE public.todo CASCADE;
TRUNCATE public.ticket_comment CASCADE;
TRUNCATE public.user_company_assignment CASCADE;
TRUNCATE public.profile CASCADE;
