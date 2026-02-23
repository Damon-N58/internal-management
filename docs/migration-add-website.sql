-- ============================================================
-- Migration: Add website column to company table
-- Run this in the Supabase SQL Editor
-- ============================================================

alter table public.company
  add column if not exists website text;
