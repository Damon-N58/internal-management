-- =============================================================================
-- Nineteen58 Company Seed Migration — Real Client Data
-- 2 UPDATEs (Planet Fitness, Vodacom) + 32 INSERTs + n8n KB entries + deadlines
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. UPDATE existing test entries
-- ----------------------------------------------------------------------------

UPDATE public.company SET
  health_score        = 1,
  priority            = 4,
  status              = 'POC',
  primary_csm         = 'Renzo Zanetti',
  implementation_lead = 'Damon Carle',
  second_lead         = 'James MacRobert',
  third_lead          = NULL,
  current_objectives  = 'Go Live + Whatsapp OTP',
  external_blockers   = NULL,
  internal_blockers   = NULL,
  future_work         = NULL,
  contract_end_date   = NULL
WHERE LOWER(REPLACE(name, ' ', '')) = 'planetfitness';

UPDATE public.company SET
  health_score        = 1,
  priority            = 2,
  status              = 'POC',
  primary_csm         = 'Dominic le Sueur',
  implementation_lead = 'Damon Carle',
  second_lead         = 'James MacRobert',
  third_lead          = NULL,
  current_objectives  = 'Get them to a deal, and get SIP working once that''s done',
  external_blockers   = NULL,
  internal_blockers   = NULL,
  future_work         = NULL,
  contract_end_date   = NULL
WHERE LOWER(name) = 'vodacom';

-- ----------------------------------------------------------------------------
-- 2. INSERT new companies (32 total)
-- ----------------------------------------------------------------------------

INSERT INTO public.company (
  id, name, health_score, priority, status,
  primary_csm, implementation_lead, second_lead, third_lead,
  current_objectives, external_blockers, internal_blockers, future_work,
  google_drive_url, contract_end_date
) VALUES

-- HEP UK
(gen_random_uuid(), 'HEP UK', 2, 4, 'Churn Risk',
 'Dominic le Sueur', 'Oliver Rowe', 'Jan Dreyer', 'James MacRobert',
 'Tesco Calling',
 'Vonage to set up trunks',
 'Get SIP Trunk For SMU working waiting for feedback from Omri regarding internal ticket.',
 NULL,
 'https://drive.google.com/drive/folders/1J3Sh-0nevN2NipmucGrg5Zj048gwhKvK',
 NULL),

-- Tesco Calling
(gen_random_uuid(), 'Tesco Calling', 0, 2, 'Active',
 'Dani le Sueur', 'Dani le Sueur', NULL, NULL,
 NULL, NULL, NULL, NULL,
 'https://drive.google.com/drive/folders/17Aw4QinewhYufwGt3f6g29r5R0-EZlR7',
 NULL),

-- Easy Equities
(gen_random_uuid(), 'Easy Equities', 1, 2, 'POC',
 'Renzo Zanetti', 'Renzo Zanetti', NULL, NULL,
 NULL, NULL, NULL, NULL,
 'https://drive.google.com/drive/folders/1M4GfaPfEX5MXYtmxEM2Xk5QUG6wAx283',
 NULL),

-- AIG Nederland
(gen_random_uuid(), 'AIG Nederland', 1, 1, 'POC',
 'Dominic le Sueur', 'Jan Dreyer', NULL, NULL,
 'Confirm if signed',
 NULL, NULL, NULL, NULL, NULL),

-- bOnline
(gen_random_uuid(), 'bOnline', 1, 4, 'POC',
 'Dominic le Sueur', 'Jan Dreyer', NULL, NULL,
 'Paused',
 NULL, NULL, NULL, NULL, NULL),

-- Hollard
(gen_random_uuid(), 'Hollard', 1, 4, 'POC',
 'Dominic le Sueur', 'Jan Dreyer', 'Dreas Vermaak', NULL,
 NULL,
 'Telviva to set up SIP for outbound calling and internal refers',
 'SIP Trunk and transfers working; Feedback from Hollard for testing',
 NULL,
 'https://drive.google.com/drive/folders/1U0AXJ8-OlfElGqU99RVif2sGvdjA09fW',
 NULL),

-- Ocean76 Investments
(gen_random_uuid(), 'Ocean76 Investments', 1, 2, 'POC',
 'Renzo Zanetti', 'Jan Dreyer', NULL, NULL,
 NULL, NULL,
 'Follow up on payment of POC invoices.',
 NULL, NULL, NULL),

-- Ignition Group (OnAir)
(gen_random_uuid(), 'Ignition Group (OnAir)', 4, 2, 'Active',
 'Dominic le Sueur', 'Jan Dreyer', 'Dreas Vermaak', NULL,
 'Voice Integration for Sophie with Yaxxa, Live chat integration Yaxxa; Remove escalation email, just handover; Update first sentence voice, Make speech slower, Make sure volume is consistent. Chat to Sasha about number; Update Dispositions, currently most conversations are categorised as other.',
 NULL, NULL, NULL, NULL, NULL),

-- Ignition Group (Spot Money)
(gen_random_uuid(), 'Ignition Group (Spot Money)', 4, 2, 'Active',
 'Dominic le Sueur', 'Jan Dreyer', 'Dreas Vermaak', NULL,
 'Draft of workflows completed, awaiting testing feedback from follow up',
 NULL, NULL, NULL, NULL, NULL),

-- IUA
(gen_random_uuid(), 'IUA', 4, 4, 'Active',
 'Dominic le Sueur', 'Jan Dreyer', NULL, NULL,
 NULL,
 'Feedback on Reporting Required; After hours routing must be set up; Implement feature code fallback; Implement changes for timeout no response',
 'Implement after hours routing; Reporting of test calls that were done; Fixed interruptions in intro; Feedback on premature transfer; Share trust centre and answer questions',
 NULL, NULL, NULL),

-- BetterSure
(gen_random_uuid(), 'BetterSure', 5, 3, 'Active',
 'Oliver Rowe', 'Jan Dreyer', 'Dreas Vermaak', NULL,
 'Follow up on Payments outstanding req; Meeting about rewards; SIP for internal routing, outbound dialling; OAuth testing working, waiting for endpoints',
 NULL, NULL, NULL, NULL, NULL),

-- Gowsikan Jeyarajah
(gen_random_uuid(), 'Gowsikan Jeyarajah', 0, 1, 'Active',
 'Dani le Sueur', 'James MacRobert', NULL, NULL,
 'Self service. Onboarded.',
 NULL, NULL, NULL, NULL, NULL),

-- Municipex
(gen_random_uuid(), 'Municipex', 1, 4, 'POC',
 'Dominic le Sueur', 'James MacRobert', 'Jan Dreyer', NULL,
 'Wait for business verification WA confirmation; Get first version of agent done for testing; create WA template to include statement; do API integration test with info provided + Google Colab Script',
 NULL, NULL, NULL, NULL, NULL),

-- White Calling
(gen_random_uuid(), 'White Calling', 1, 4, 'POC',
 'Dani le Sueur', 'James MacRobert', 'Jan Dreyer', NULL,
 'They are doing testing; Follow up on integration and test feedback',
 NULL, NULL, NULL, NULL, NULL),

-- Hollywood Bets
(gen_random_uuid(), 'Hollywood Bets', 3, 2, 'Active',
 'Dominic le Sueur', 'James MacRobert', NULL, NULL,
 'Get feedback on latest campaign of 650 leads; possible updates to reporting; Fix the campaign dialling logic issue?',
 NULL, NULL, NULL, NULL, NULL),

-- Re/Max
(gen_random_uuid(), 'Re/Max', 3, 2, 'Active',
 'Renzo Zanetti', 'James MacRobert', 'Jan Dreyer', NULL,
 'Test Super Memory with Agent tool, communicate how integration will work, get platform hosted on new URL (DNS records for subdomain); Github for widget (https://rx-mvp-search.vercel.app/)',
 NULL, NULL, NULL, NULL, NULL),

-- Ignition Group (CX)
(gen_random_uuid(), 'Ignition Group (CX)', 4, 2, 'Active',
 'Dominic le Sueur', 'James MacRobert', NULL, NULL,
 'WhatsApp channel sorted, Voice waiting for Yaxxa, Smiley Migrated, Me&You WA, Training for OnAir Team',
 NULL,
 'Smiley Bot transfers; Spot Money Feedback regarding structure',
 NULL, NULL, NULL),

-- Pedal and Chain
(gen_random_uuid(), 'Pedal and Chain', 0, 2, 'Active',
 'Aimee le Sueur', 'Dreas Vermaak', NULL, NULL,
 NULL, NULL, NULL, NULL, NULL, NULL),

-- Calgro
(gen_random_uuid(), 'Calgro', 1, 3, 'POC',
 'Renzo Zanetti', 'Dreas Vermaak', 'Jan Dreyer', NULL,
 'Feedback for email agent',
 NULL, NULL, NULL, NULL, NULL),

-- Hey Jude
(gen_random_uuid(), 'Hey Jude', 1, 2, 'POC',
 'Renzo Zanetti', 'Dreas Vermaak', NULL, NULL,
 NULL, NULL, NULL, NULL, NULL, NULL),

-- On-Site241
(gen_random_uuid(), 'On-Site241', 1, 2, 'POC',
 'Dominic le Sueur', 'Dreas Vermaak', NULL, NULL,
 'Twilio Lag issue feedback from Mihret; Scripts for Outbound Review Agent -> Testing',
 NULL, NULL, NULL, NULL, NULL),

-- The Unlimited
(gen_random_uuid(), 'The Unlimited', 2, 2, 'Churn Risk',
 'Dominic le Sueur', 'Dreas Vermaak', NULL, NULL,
 'Waiting on API integration and new campaign leads; update prompt',
 NULL, NULL, NULL, NULL, NULL),

-- Cliqtech
(gen_random_uuid(), 'Cliqtech', 3, 2, 'Active',
 'Renzo Zanetti', 'Dreas Vermaak', 'Damon Carle', NULL,
 '1Life Support Bot; Voice Agent Capture interest in will; Find out what is going on',
 NULL, NULL, NULL, NULL, NULL),

-- Eagle Motor City
(gen_random_uuid(), 'Eagle Motor City', 3, 3, 'Active',
 'Renzo Zanetti', 'Dreas Vermaak', NULL, NULL,
 'API integration is done, test web agent, Fix campaign issues spam (Not really); Get them banned',
 NULL, NULL, NULL, NULL, NULL),

-- FastR
(gen_random_uuid(), 'FastR', 4, 3, 'Active',
 'Renzo Zanetti', 'Dreas Vermaak', NULL, NULL,
 'API integration (check status, create ticket if issue), transfer manychat number',
 NULL, NULL,
 'Voice inbound for support',
 NULL, NULL),

-- Ignition Group (Spot Connect)
(gen_random_uuid(), 'Ignition Group (Spot Connect)', 4, 4, 'Active',
 'Dominic le Sueur', 'Dreas Vermaak', 'Jan Dreyer', NULL,
 'Set up Transfers to partners via new number (SIP)',
 NULL, NULL, NULL, NULL, NULL),

-- Ignition Group (HR)
(gen_random_uuid(), 'Ignition Group (HR)', 4, 4, 'Active',
 'Dominic le Sueur', 'Dreas Vermaak', 'Oliver Rowe', NULL,
 'DB access is a problem. Review feedback and make stability and error handling fixes; Workflow reporting feedback + API',
 NULL, NULL, NULL, NULL, NULL),

-- HEP SA
(gen_random_uuid(), 'HEP SA', 5, 4, 'Active',
 'Renzo Zanetti', 'Dreas Vermaak', 'Jan Dreyer', NULL,
 'Unqualified leads to UCT only FPD remaining; Waiting for fix from HEP for Application ids for FPD leads',
 NULL, NULL, NULL, NULL, NULL),

-- Valenture Institute (UCT Online) — CSM left blank per user, defaulting to Dominic
(gen_random_uuid(), 'Valenture Institute (UCT Online)', 5, 3, 'Active',
 'Dominic le Sueur', 'Dreas Vermaak', 'Jan Dreyer', NULL,
 'Marketing agent test and finalise; Send out HEP opt ins',
 NULL, NULL, NULL, NULL, NULL),

-- Retailability
(gen_random_uuid(), 'Retailability', 1, 2, 'POC',
 'Dominic le Sueur', 'Damon Carle', 'Dreas Vermaak', 'Oliver Rowe',
 'Google colab was improved and fixed - Working on automation now; Organisation of prompts and flows',
 NULL, NULL,
 'Automation',
 NULL, NULL),

-- Metropolitan
(gen_random_uuid(), 'Metropolitan', 1, 4, 'POC',
 'Dominic le Sueur', 'James MacRobert', 'Jan Dreyer', NULL,
 NULL, NULL, NULL, NULL,
 'https://drive.google.com/drive/folders/1jZd9iO4tZc37n638n9PGQTabE5kNQ4_D',
 NULL),

-- Discovery
(gen_random_uuid(), 'Discovery', 1, 4, 'POC',
 'Renzo Zanetti', 'Jan Dreyer', 'Dreas Vermaak', NULL,
 'Complete outstanding compliance documentation; Start with LMS integration.',
 NULL, NULL, NULL,
 'https://drive.google.com/drive/folders/1Nz6y35WtXA2zMU4s_XLJGnkmcnCxDsrg',
 NULL);

-- ----------------------------------------------------------------------------
-- 3. INSERT n8n workflow Knowledge Base entries (url field, type = Link)
--    Using NOT EXISTS to avoid duplicates on re-run
-- ----------------------------------------------------------------------------

INSERT INTO public.knowledge_base_entry (id, company_id, title, type, url)
SELECT gen_random_uuid(), c.id, 'n8n Workflows', 'Link', v.workflow_url
FROM (VALUES
  ('HEP UK',                        'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/O5NAv7VQ6n32kNNu/workflows'),
  ('bOnline',                       'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/fTRTtsW32NCPy9Uo/workflows'),
  ('Ocean76 Investments',           'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/9hCQCsfQSjHNVrt8/workflows'),
  ('Ignition Group (OnAir)',        'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/32xrU2mGFlH1mPqU/workflows'),
  ('IUA',                           'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/8lD6artmFyzVpjoU/workflows'),
  ('BetterSure',                    'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/8Cf4V18WiEfGjs1e/workflows'),
  ('Hollywood Bets',                'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/FesgZNxYEkcwLvm1/workflows'),
  ('Re/Max',                        'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/6GvQSS2SvweY75WH/workflows'),
  ('Ignition Group (CX)',           'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/ULSdCOCwL3iqR2ZA/workflows'),
  ('Pedal and Chain',               'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/2bAMS6s6WFbyEKen/workflows'),
  ('Calgro',                        'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/y0uYrr9kRzBGTF4E/workflows'),
  ('On-Site241',                    'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/XXwK0MeYsgkIrOaM/workflows'),
  ('The Unlimited',                 'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/xmLUF8B81IjxoLmx/workflows'),
  ('Cliqtech',                      'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/LNvKIArO4o9W3a64/workflows'),
  ('Eagle Motor City',              'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/cul2lO7MrMtgvvYt/workflows'),
  ('Ignition Group (Spot Connect)', 'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/ULSdCOCwL3iqR2ZA/workflows'),
  ('HEP SA',                        'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/wE64cEaA99y2hQkI/workflows'),
  ('Retailability',                 'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/pbVFxBmpLKBxn7dz/workflows')
) AS v(company_name, workflow_url)
JOIN public.company c ON c.name = v.company_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.knowledge_base_entry kb
  WHERE kb.company_id = c.id AND kb.title = 'n8n Workflows'
);

-- Planet Fitness and Vodacom n8n entries (UPDATE targets — handle separately)
INSERT INTO public.knowledge_base_entry (id, company_id, title, type, url)
SELECT gen_random_uuid(), c.id, 'n8n Workflows', 'Link', v.workflow_url
FROM (VALUES
  ('planetfitness', 'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/WSN6jpEUfAnV4ARQ/workflows'),
  ('vodacom',       'https://workflows.nineteen58.tech/projects/EBax9qdzPw1iwvd1/folders/f42EUxg56Q3703pD/workflows')
) AS v(name_lower, workflow_url)
JOIN public.company c ON LOWER(REPLACE(c.name, ' ', '')) = v.name_lower
WHERE NOT EXISTS (
  SELECT 1 FROM public.knowledge_base_entry kb
  WHERE kb.company_id = c.id AND kb.title = 'n8n Workflows'
);

-- ----------------------------------------------------------------------------
-- 4. INSERT deadlines
-- ----------------------------------------------------------------------------

-- Ignition Group (OnAir): 2026-02-20
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(),
       'Change prompt WA to remove email escalation only handover (consultant will help in next 1/2 day)',
       '2026-02-20',
       c.id
FROM public.company c WHERE c.name = 'Ignition Group (OnAir)';

-- IUA: 2026-02-13
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Outstanding items review', '2026-02-13', c.id
FROM public.company c WHERE c.name = 'IUA';

-- Municipex: 2026-02-24
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Test version of AI Agent', '2026-02-24', c.id
FROM public.company c WHERE c.name = 'Municipex';

-- Re/Max: 2026-02-26
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Customisation of the widget / provide template to Andrija', '2026-02-26', c.id
FROM public.company c WHERE c.name = 'Re/Max';

-- Ignition Group (CX): 2026-02-26
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Me and You demo line', '2026-02-26', c.id
FROM public.company c WHERE c.name = 'Ignition Group (CX)';

-- FastR: 2026-02-20
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Migrate Manychat Number', '2026-02-20', c.id
FROM public.company c WHERE c.name = 'FastR';

-- Ignition Group (Spot Connect): 2026-03-04
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Put Smiley on Transfers; Migrate to Number with transfers', '2026-03-04', c.id
FROM public.company c WHERE c.name = 'Ignition Group (Spot Connect)';

-- Valenture Institute (UCT Online): 2026-02-24
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Send out messages with new templates (Waiting for deep link from Chris)', '2026-02-24', c.id
FROM public.company c WHERE c.name = 'Valenture Institute (UCT Online)';

-- Discovery: 2026-03-03
INSERT INTO public.deadline (id, description, due_date, company_id)
SELECT gen_random_uuid(), 'Provide feedback on compliance timeline and outstanding docs', '2026-03-03', c.id
FROM public.company c WHERE c.name = 'Discovery';

-- ----------------------------------------------------------------------------
-- End of migration
-- ----------------------------------------------------------------------------
