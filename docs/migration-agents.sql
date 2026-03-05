-- ============================================================
-- Migration: Add agent_config table for per-company AI agent documentation
-- Run this in the Supabase SQL Editor before deploying the code.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  description text,
  prompt text,
  channel text,
  tool_calls text,
  external_resources text,
  weekly_tasks text,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_config_company_id_idx ON public.agent_config(company_id);

-- ---------------------------------------------------------------------------
-- RLS for agent_config
-- Depends on the helper functions created in migration-rls-policies.sql.
-- Run that migration first, then this one.
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_select" ON public.agent_config;
DROP POLICY IF EXISTS "agent_insert" ON public.agent_config;
DROP POLICY IF EXISTS "agent_update" ON public.agent_config;
DROP POLICY IF EXISTS "agent_delete" ON public.agent_config;

CREATE POLICY "agent_select"
  ON public.agent_config FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "agent_insert"
  ON public.agent_config FOR INSERT TO authenticated
  WITH CHECK (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "agent_update"
  ON public.agent_config FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id))
  WITH CHECK (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id));

CREATE POLICY "agent_delete"
  ON public.agent_config FOR DELETE TO authenticated
  USING (public.rls_is_manager_or_above());
