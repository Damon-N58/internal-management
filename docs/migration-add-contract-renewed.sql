-- =============================================================================
-- Add contract_start_date column to the company table
-- Safe to re-run (IF NOT EXISTS guard).
-- =============================================================================

ALTER TABLE public.company
  ADD COLUMN IF NOT EXISTS contract_start_date date;
