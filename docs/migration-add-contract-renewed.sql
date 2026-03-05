-- =============================================================================
-- Add contract_renewed boolean column to the company table
-- Safe to re-run (IF NOT EXISTS guard).
-- =============================================================================

ALTER TABLE public.company
  ADD COLUMN IF NOT EXISTS contract_renewed boolean NOT NULL DEFAULT false;
