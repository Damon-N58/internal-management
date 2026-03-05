-- =============================================================================
-- Add completed_by column to product_change_request
-- Stores the full name of the person who completed/closed the item.
-- Safe to re-run (IF NOT EXISTS guard).
-- =============================================================================

ALTER TABLE public.product_change_request
  ADD COLUMN IF NOT EXISTS completed_by text;
