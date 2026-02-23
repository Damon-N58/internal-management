-- ============================================================
-- Migration: Add defaults to all Prisma-origin tables
-- Prisma generated IDs (cuid) and timestamps in application
-- code. Now that we use Supabase JS SDK directly, we need
-- database-level defaults for both id and timestamp columns.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ========================
-- ID defaults (TEXT type — generate a uuid-like text string)
-- ========================

-- Helper function to generate a cuid-like text id
CREATE OR REPLACE FUNCTION generate_text_id()
RETURNS text AS $$
BEGIN
  RETURN replace(gen_random_uuid()::text, '-', '');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.company ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.ticket ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.activity_log ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.product_change_request ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.blocker ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.notification ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.health_score_log ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.knowledge_base_entry ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.deadline ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE public.technical_vault ALTER COLUMN id SET DEFAULT generate_text_id();

-- ========================
-- Timestamp defaults
-- ========================

-- company
ALTER TABLE public.company ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.company ALTER COLUMN updated_at SET DEFAULT now();

-- ticket
ALTER TABLE public.ticket ALTER COLUMN created_at SET DEFAULT now();

-- activity_log
ALTER TABLE public.activity_log ALTER COLUMN created_at SET DEFAULT now();

-- product_change_request
ALTER TABLE public.product_change_request ALTER COLUMN created_at SET DEFAULT now();

-- blocker
ALTER TABLE public.blocker ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.blocker ALTER COLUMN updated_at SET DEFAULT now();

-- notification
ALTER TABLE public.notification ALTER COLUMN created_at SET DEFAULT now();

-- health_score_log
ALTER TABLE public.health_score_log ALTER COLUMN calculated_at SET DEFAULT now();

-- knowledge_base_entry
ALTER TABLE public.knowledge_base_entry ALTER COLUMN created_at SET DEFAULT now();
