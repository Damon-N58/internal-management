-- =============================================================================
-- Row Level Security Policies — N58 Internal Portal
--
-- Auth model:
--   • profile.role: 'Admin' | 'Manager' | 'Member'
--   • auth.uid() matches profile.id  (requires Clerk → Supabase JWT integration)
--   • user_company_assignment scopes Members to their assigned companies
--   • Admins/Managers see everything; Members are scoped to assigned companies
--
-- NOTE: The app's server actions use SUPABASE_SERVICE_ROLE_KEY, which bypasses
-- RLS entirely. These policies protect against direct DB access (pgAdmin,
-- REST API calls with the anon key, etc.) and are a security safety net.
--
-- Safe to re-run: each policy is dropped before being (re)created.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Enable RLS on every table
-- ---------------------------------------------------------------------------
ALTER TABLE public.profile                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_assignment  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_vault          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comment           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadline                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocker                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_entry     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_score_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_change_request   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo                     ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 1. Helper functions
--    SECURITY DEFINER: runs as the function owner so they can query the
--    profile and user_company_assignment tables without being blocked by
--    those tables' own policies. Marked STABLE so Postgres can cache
--    the result within a single query.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rls_is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profile
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.rls_is_manager_or_above()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profile
    WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.rls_is_assigned_to(cid text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_company_assignment
    WHERE user_id = auth.uid() AND company_id = cid
  );
$$;


-- ---------------------------------------------------------------------------
-- 2. profile
--    READ   : any authenticated user (needed for team member dropdowns)
--    INSERT : own row on first login, or admin
--    UPDATE : own row, or admin
--    DELETE : admin only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profile_select"       ON public.profile;
DROP POLICY IF EXISTS "profile_insert"       ON public.profile;
DROP POLICY IF EXISTS "profile_update"       ON public.profile;
DROP POLICY IF EXISTS "profile_delete"       ON public.profile;

CREATE POLICY "profile_select"
  ON public.profile FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profile_insert"
  ON public.profile FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.rls_is_admin());

CREATE POLICY "profile_update"
  ON public.profile FOR UPDATE TO authenticated
  USING  (id = auth.uid() OR public.rls_is_admin())
  WITH CHECK (id = auth.uid() OR public.rls_is_admin());

CREATE POLICY "profile_delete"
  ON public.profile FOR DELETE TO authenticated
  USING (public.rls_is_admin());


-- ---------------------------------------------------------------------------
-- 3. user_company_assignment
--    READ   : any authenticated user (sidebar needs to resolve assignments)
--    INSERT : manager or above
--    DELETE : manager or above
--    (no UPDATE — rows are created and removed, never mutated)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "uca_select" ON public.user_company_assignment;
DROP POLICY IF EXISTS "uca_insert" ON public.user_company_assignment;
DROP POLICY IF EXISTS "uca_delete" ON public.user_company_assignment;

CREATE POLICY "uca_select"
  ON public.user_company_assignment FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "uca_insert"
  ON public.user_company_assignment FOR INSERT TO authenticated
  WITH CHECK (public.rls_is_manager_or_above());

CREATE POLICY "uca_delete"
  ON public.user_company_assignment FOR DELETE TO authenticated
  USING (public.rls_is_manager_or_above());


-- ---------------------------------------------------------------------------
-- 4. company
--    READ   : manager-or-above sees all; member sees only assigned
--    INSERT : manager or above
--    UPDATE : manager-or-above, or any assigned member
--    DELETE : admin only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_select" ON public.company;
DROP POLICY IF EXISTS "company_insert" ON public.company;
DROP POLICY IF EXISTS "company_update" ON public.company;
DROP POLICY IF EXISTS "company_delete" ON public.company;

CREATE POLICY "company_select"
  ON public.company FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(id)
  );

CREATE POLICY "company_insert"
  ON public.company FOR INSERT TO authenticated
  WITH CHECK (public.rls_is_manager_or_above());

CREATE POLICY "company_update"
  ON public.company FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(id))
  WITH CHECK (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(id));

CREATE POLICY "company_delete"
  ON public.company FOR DELETE TO authenticated
  USING (public.rls_is_admin());


-- ---------------------------------------------------------------------------
-- 5. technical_vault  (sensitive credentials)
--    READ   : manager-or-above, or assigned member
--    WRITE  : manager-or-above, or assigned member
--    DELETE : admin only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "vault_select" ON public.technical_vault;
DROP POLICY IF EXISTS "vault_insert" ON public.technical_vault;
DROP POLICY IF EXISTS "vault_update" ON public.technical_vault;
DROP POLICY IF EXISTS "vault_delete" ON public.technical_vault;

CREATE POLICY "vault_select"
  ON public.technical_vault FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "vault_insert"
  ON public.technical_vault FOR INSERT TO authenticated
  WITH CHECK (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "vault_update"
  ON public.technical_vault FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id))
  WITH CHECK (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id));

CREATE POLICY "vault_delete"
  ON public.technical_vault FOR DELETE TO authenticated
  USING (public.rls_is_admin());


-- ---------------------------------------------------------------------------
-- 6. activity_log  (immutable — no UPDATE)
--    READ   : manager-or-above, or assigned member
--    INSERT : manager-or-above, or assigned member
--    DELETE : admin only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_delete" ON public.activity_log;

CREATE POLICY "activity_log_select"
  ON public.activity_log FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "activity_log_insert"
  ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "activity_log_delete"
  ON public.activity_log FOR DELETE TO authenticated
  USING (public.rls_is_admin());


-- ---------------------------------------------------------------------------
-- 7. ticket
--    READ/WRITE : manager-or-above, or assigned member
--    DELETE     : manager-or-above, or assigned member
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "ticket_select" ON public.ticket;
DROP POLICY IF EXISTS "ticket_insert" ON public.ticket;
DROP POLICY IF EXISTS "ticket_update" ON public.ticket;
DROP POLICY IF EXISTS "ticket_delete" ON public.ticket;

CREATE POLICY "ticket_select"
  ON public.ticket FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "ticket_insert"
  ON public.ticket FOR INSERT TO authenticated
  WITH CHECK (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "ticket_update"
  ON public.ticket FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id))
  WITH CHECK (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id));

CREATE POLICY "ticket_delete"
  ON public.ticket FOR DELETE TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );


-- ---------------------------------------------------------------------------
-- 8. ticket_comment
--    READ   : users assigned to the ticket's company (resolved via subquery)
--    INSERT : author must be self + must be assigned to the company
--    UPDATE : own comment only, or manager-or-above
--    DELETE : own comment only, or manager-or-above
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "ticket_comment_select" ON public.ticket_comment;
DROP POLICY IF EXISTS "ticket_comment_insert" ON public.ticket_comment;
DROP POLICY IF EXISTS "ticket_comment_update" ON public.ticket_comment;
DROP POLICY IF EXISTS "ticket_comment_delete" ON public.ticket_comment;

CREATE POLICY "ticket_comment_select"
  ON public.ticket_comment FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR EXISTS (
      SELECT 1 FROM public.ticket t
      WHERE t.id = ticket_id
        AND public.rls_is_assigned_to(t.company_id)
    )
  );

CREATE POLICY "ticket_comment_insert"
  ON public.ticket_comment FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      public.rls_is_manager_or_above()
      OR EXISTS (
        SELECT 1 FROM public.ticket t
        WHERE t.id = ticket_id
          AND public.rls_is_assigned_to(t.company_id)
      )
    )
  );

CREATE POLICY "ticket_comment_update"
  ON public.ticket_comment FOR UPDATE TO authenticated
  USING  (author_id = auth.uid() OR public.rls_is_manager_or_above())
  WITH CHECK (author_id = auth.uid() OR public.rls_is_manager_or_above());

CREATE POLICY "ticket_comment_delete"
  ON public.ticket_comment FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.rls_is_manager_or_above());


-- ---------------------------------------------------------------------------
-- 9. deadline
--    READ/WRITE : manager-or-above, or assigned member
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "deadline_select" ON public.deadline;
DROP POLICY IF EXISTS "deadline_insert" ON public.deadline;
DROP POLICY IF EXISTS "deadline_update" ON public.deadline;
DROP POLICY IF EXISTS "deadline_delete" ON public.deadline;

CREATE POLICY "deadline_select"
  ON public.deadline FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "deadline_insert"
  ON public.deadline FOR INSERT TO authenticated
  WITH CHECK (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "deadline_update"
  ON public.deadline FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id))
  WITH CHECK (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id));

CREATE POLICY "deadline_delete"
  ON public.deadline FOR DELETE TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );


-- ---------------------------------------------------------------------------
-- 10. blocker
--     READ/WRITE : manager-or-above, or assigned member
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "blocker_select" ON public.blocker;
DROP POLICY IF EXISTS "blocker_insert" ON public.blocker;
DROP POLICY IF EXISTS "blocker_update" ON public.blocker;
DROP POLICY IF EXISTS "blocker_delete" ON public.blocker;

CREATE POLICY "blocker_select"
  ON public.blocker FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "blocker_insert"
  ON public.blocker FOR INSERT TO authenticated
  WITH CHECK (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "blocker_update"
  ON public.blocker FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id))
  WITH CHECK (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id));

CREATE POLICY "blocker_delete"
  ON public.blocker FOR DELETE TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );


-- ---------------------------------------------------------------------------
-- 11. knowledge_base_entry
--     READ/WRITE : manager-or-above, or assigned member
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "kb_select" ON public.knowledge_base_entry;
DROP POLICY IF EXISTS "kb_insert" ON public.knowledge_base_entry;
DROP POLICY IF EXISTS "kb_update" ON public.knowledge_base_entry;
DROP POLICY IF EXISTS "kb_delete" ON public.knowledge_base_entry;

CREATE POLICY "kb_select"
  ON public.knowledge_base_entry FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "kb_insert"
  ON public.knowledge_base_entry FOR INSERT TO authenticated
  WITH CHECK (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "kb_update"
  ON public.knowledge_base_entry FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id))
  WITH CHECK (public.rls_is_manager_or_above() OR public.rls_is_assigned_to(company_id));

CREATE POLICY "kb_delete"
  ON public.knowledge_base_entry FOR DELETE TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );


-- ---------------------------------------------------------------------------
-- 12. notification
--     company_id IS NULL = global (visible to all authenticated users)
--     company_id IS NOT NULL = scoped to assigned users for that company
--     INSERT : manager-or-above (automated writes use service role)
--     UPDATE : any user who can see the notification (e.g. mark as read)
--     DELETE : admin only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "notification_select" ON public.notification;
DROP POLICY IF EXISTS "notification_insert" ON public.notification;
DROP POLICY IF EXISTS "notification_update" ON public.notification;
DROP POLICY IF EXISTS "notification_delete" ON public.notification;

CREATE POLICY "notification_select"
  ON public.notification FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "notification_insert"
  ON public.notification FOR INSERT TO authenticated
  WITH CHECK (public.rls_is_manager_or_above());

CREATE POLICY "notification_update"
  ON public.notification FOR UPDATE TO authenticated
  USING  (
    company_id IS NULL
    OR public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  )
  WITH CHECK (
    company_id IS NULL
    OR public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "notification_delete"
  ON public.notification FOR DELETE TO authenticated
  USING (public.rls_is_admin());


-- ---------------------------------------------------------------------------
-- 13. health_score_log  (immutable history — no UPDATE)
--     READ   : manager-or-above, or assigned member
--     INSERT : manager-or-above (automated writes use service role)
--     DELETE : admin only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "health_log_select" ON public.health_score_log;
DROP POLICY IF EXISTS "health_log_insert" ON public.health_score_log;
DROP POLICY IF EXISTS "health_log_delete" ON public.health_score_log;

CREATE POLICY "health_log_select"
  ON public.health_score_log FOR SELECT TO authenticated
  USING (
    public.rls_is_manager_or_above()
    OR public.rls_is_assigned_to(company_id)
  );

CREATE POLICY "health_log_insert"
  ON public.health_score_log FOR INSERT TO authenticated
  WITH CHECK (public.rls_is_manager_or_above());

CREATE POLICY "health_log_delete"
  ON public.health_score_log FOR DELETE TO authenticated
  USING (public.rls_is_admin());


-- ---------------------------------------------------------------------------
-- 14. product_change_request  (no company_id — it's the shared product roadmap)
--     READ   : all authenticated users
--     INSERT : all authenticated users
--     UPDATE : manager-or-above
--     DELETE : manager-or-above
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "pcr_select" ON public.product_change_request;
DROP POLICY IF EXISTS "pcr_insert" ON public.product_change_request;
DROP POLICY IF EXISTS "pcr_update" ON public.product_change_request;
DROP POLICY IF EXISTS "pcr_delete" ON public.product_change_request;

CREATE POLICY "pcr_select"
  ON public.product_change_request FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pcr_insert"
  ON public.product_change_request FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "pcr_update"
  ON public.product_change_request FOR UPDATE TO authenticated
  USING  (public.rls_is_manager_or_above())
  WITH CHECK (public.rls_is_manager_or_above());

CREATE POLICY "pcr_delete"
  ON public.product_change_request FOR DELETE TO authenticated
  USING (public.rls_is_manager_or_above());


-- ---------------------------------------------------------------------------
-- 15. agent_config
--     READ/WRITE : manager-or-above, or assigned member
--     DELETE     : manager-or-above only
-- ---------------------------------------------------------------------------
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


-- ---------------------------------------------------------------------------
-- 16. todo
--     Fully private — each user sees and manages only their own todos
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "todo_select" ON public.todo;
DROP POLICY IF EXISTS "todo_insert" ON public.todo;
DROP POLICY IF EXISTS "todo_update" ON public.todo;
DROP POLICY IF EXISTS "todo_delete" ON public.todo;

CREATE POLICY "todo_select"
  ON public.todo FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "todo_insert"
  ON public.todo FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "todo_update"
  ON public.todo FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "todo_delete"
  ON public.todo FOR DELETE TO authenticated
  USING (user_id = auth.uid());
