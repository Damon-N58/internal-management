-- =============================================================================
-- Bootstrap user_company_assignment for existing companies
-- Matches primary_csm, implementation_lead, second_lead, third_lead
-- against profile.full_name and creates assignments where missing.
-- Safe to re-run (NOT EXISTS guard).
-- =============================================================================

INSERT INTO public.user_company_assignment (id, user_id, company_id)
SELECT
  gen_random_uuid(),
  p.id,
  c.id
FROM public.company c
JOIN public.profile p
  ON p.full_name IN (
    c.primary_csm,
    c.implementation_lead,
    c.second_lead,
    c.third_lead
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_company_assignment uca
  WHERE uca.user_id = p.id
    AND uca.company_id = c.id
);
