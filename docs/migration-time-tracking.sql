-- ============================================================
-- Migration: Add time tracking to tickets + "General" company
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add time tracking columns to ticket
alter table public.ticket
  add column if not exists estimated_hours numeric,
  add column if not exists actual_hours numeric,
  add column if not exists closed_at timestamptz;

-- 2. Create a "General" pseudo-company for internal tasks
insert into public.company (id, name, status, primary_csm, implementation_lead, health_score, priority, created_at, updated_at)
values ('_general', 'General', 'Active', 'Internal', 'Internal', 5, 5, now(), now())
on conflict (id) do nothing;
