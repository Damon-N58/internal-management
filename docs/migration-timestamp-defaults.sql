-- ============================================================
-- Migration: Add default now() to all timestamp columns
-- These tables were originally managed by Prisma which set
-- timestamps in app code. Supabase inserts need DB defaults.
-- Run this in the Supabase SQL Editor.
-- ============================================================

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

-- deadline (no timestamp column to fix)
-- technical_vault (no timestamp column to fix)
