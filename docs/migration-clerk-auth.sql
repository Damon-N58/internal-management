-- ============================================================
-- Migration: Switch from Supabase Auth to Clerk
-- Clerk user IDs are text strings (user_xxx), not UUIDs.
-- Must change profile.id and all FK references from uuid to text.
-- Run this in the Supabase SQL Editor BEFORE deploying the new code.
-- ============================================================

-- 1. Drop the auto-create trigger (no longer needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Drop ALL RLS policies referencing auth.uid()
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

-- 3. Disable RLS (service role bypasses it anyway, but keep it clean)
ALTER TABLE public.profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_assignment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comment DISABLE ROW LEVEL SECURITY;

-- 4. Dynamically drop EVERY FK constraint that references profile(id)
--    This catches any constraint name — profile_id_fkey, uca_user_id_fkey, etc.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.conname, tc.conrelid::regclass::text AS tbl
        FROM pg_constraint tc
        WHERE tc.confrelid = 'public.profile'::regclass
          AND tc.contype = 'f'
    ) LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tbl, r.conname);
        RAISE NOTICE 'Dropped FK % on %', r.conname, r.tbl;
    END LOOP;
END $$;

-- 5. Also drop the named FKs we know about (belt-and-suspenders)
ALTER TABLE public.user_company_assignment DROP CONSTRAINT IF EXISTS uca_user_id_fkey;
ALTER TABLE public.ticket_comment DROP CONSTRAINT IF EXISTS ticket_comment_author_id_fkey;
ALTER TABLE public.todo DROP CONSTRAINT IF EXISTS todo_user_id_fkey;

-- 6. Drop any unique constraints on user_company_assignment that reference user_id
--    (needed before altering the column type)
ALTER TABLE public.user_company_assignment
  DROP CONSTRAINT IF EXISTS user_company_assignment_user_id_company_id_key;

-- 7. Drop the primary key on profile (find it dynamically)
DO $$
DECLARE
    pk_name text;
BEGIN
    SELECT conname INTO pk_name
    FROM pg_constraint
    WHERE conrelid = 'public.profile'::regclass
      AND contype = 'p';
    IF pk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.profile DROP CONSTRAINT %I', pk_name);
        RAISE NOTICE 'Dropped PK %', pk_name;
    END IF;
END $$;

-- 8. Change column types from uuid to text
ALTER TABLE public.profile
  ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE public.user_company_assignment
  ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.ticket_comment
  ALTER COLUMN author_id TYPE text USING author_id::text;

ALTER TABLE public.todo
  ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.ticket
  ALTER COLUMN assigned_to TYPE text USING assigned_to::text;

-- 9. Re-add primary key on profile
ALTER TABLE public.profile ADD PRIMARY KEY (id);

-- 10. Re-add foreign keys
ALTER TABLE public.user_company_assignment
  ADD CONSTRAINT uca_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profile(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_comment
  ADD CONSTRAINT ticket_comment_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profile(id) ON DELETE CASCADE;

ALTER TABLE public.todo
  ADD CONSTRAINT todo_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profile(id) ON DELETE CASCADE;

-- 11. Re-add unique constraint on user_company_assignment
DO $$ BEGIN
  ALTER TABLE public.user_company_assignment
    ADD CONSTRAINT user_company_assignment_user_id_company_id_key UNIQUE (user_id, company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 12. Clear existing auth-linked data (fresh start with Clerk users)
TRUNCATE public.todo CASCADE;
TRUNCATE public.ticket_comment CASCADE;
TRUNCATE public.user_company_assignment CASCADE;
TRUNCATE public.profile CASCADE;
