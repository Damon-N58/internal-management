-- ============================================================
-- Nineteen58 Portal: Rename tables & columns to snake_case
-- Run this in the Supabase SQL Editor BEFORE starting the app
-- ============================================================

-- 1. Rename tables
ALTER TABLE "Company" RENAME TO company;
ALTER TABLE "TechnicalVault" RENAME TO technical_vault;
ALTER TABLE "ProductChangeRequest" RENAME TO product_change_request;
ALTER TABLE "ActivityLog" RENAME TO activity_log;
ALTER TABLE "Ticket" RENAME TO ticket;
ALTER TABLE "Deadline" RENAME TO deadline;
ALTER TABLE "Blocker" RENAME TO blocker;
ALTER TABLE "KnowledgeBaseEntry" RENAME TO knowledge_base_entry;
ALTER TABLE "Notification" RENAME TO notification;
ALTER TABLE "HealthScoreLog" RENAME TO health_score_log;

-- 2. Rename columns: company
ALTER TABLE company RENAME COLUMN "healthScore" TO health_score;
ALTER TABLE company RENAME COLUMN "contractEndDate" TO contract_end_date;
ALTER TABLE company RENAME COLUMN "primaryCSM" TO primary_csm;
ALTER TABLE company RENAME COLUMN "implementationLead" TO implementation_lead;
ALTER TABLE company RENAME COLUMN "secondLead" TO second_lead;
ALTER TABLE company RENAME COLUMN "thirdLead" TO third_lead;
ALTER TABLE company RENAME COLUMN "currentObjectives" TO current_objectives;
ALTER TABLE company RENAME COLUMN "externalBlockers" TO external_blockers;
ALTER TABLE company RENAME COLUMN "internalBlockers" TO internal_blockers;
ALTER TABLE company RENAME COLUMN "futureWork" TO future_work;
ALTER TABLE company RENAME COLUMN "lastActivityAt" TO last_activity_at;
ALTER TABLE company RENAME COLUMN "conversationVolume" TO conversation_volume;
ALTER TABLE company RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE company RENAME COLUMN "updatedAt" TO updated_at;

-- 3. Rename columns: technical_vault
ALTER TABLE technical_vault RENAME COLUMN "companyId" TO company_id;
ALTER TABLE technical_vault RENAME COLUMN "ftpInfo" TO ftp_info;
ALTER TABLE technical_vault RENAME COLUMN "apiKeys" TO api_keys;
ALTER TABLE technical_vault RENAME COLUMN "sshConfig" TO ssh_config;
ALTER TABLE technical_vault RENAME COLUMN "otherSecrets" TO other_secrets;

-- 4. Rename columns: product_change_request
ALTER TABLE product_change_request RENAME COLUMN "requestedBy" TO requested_by;
ALTER TABLE product_change_request RENAME COLUMN "assignedTo" TO assigned_to;
ALTER TABLE product_change_request RENAME COLUMN "completedAt" TO completed_at;
ALTER TABLE product_change_request RENAME COLUMN "createdAt" TO created_at;

-- 5. Rename columns: activity_log
ALTER TABLE activity_log RENAME COLUMN "companyId" TO company_id;
ALTER TABLE activity_log RENAME COLUMN "createdAt" TO created_at;

-- 6. Rename columns: ticket
ALTER TABLE ticket RENAME COLUMN "companyId" TO company_id;
ALTER TABLE ticket RENAME COLUMN "createdAt" TO created_at;

-- 7. Rename columns: deadline
ALTER TABLE deadline RENAME COLUMN "companyId" TO company_id;
ALTER TABLE deadline RENAME COLUMN "dueDate" TO due_date;

-- 8. Rename columns: blocker
ALTER TABLE blocker RENAME COLUMN "resolutionDeadline" TO resolution_deadline;
ALTER TABLE blocker RENAME COLUMN "escalationLevel" TO escalation_level;
ALTER TABLE blocker RENAME COLUMN "companyId" TO company_id;
ALTER TABLE blocker RENAME COLUMN "resolvedAt" TO resolved_at;
ALTER TABLE blocker RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE blocker RENAME COLUMN "updatedAt" TO updated_at;

-- 9. Rename columns: knowledge_base_entry
ALTER TABLE knowledge_base_entry RENAME COLUMN "companyId" TO company_id;
ALTER TABLE knowledge_base_entry RENAME COLUMN "createdAt" TO created_at;

-- 10. Rename columns: notification
ALTER TABLE notification RENAME COLUMN "isRead" TO is_read;
ALTER TABLE notification RENAME COLUMN "companyId" TO company_id;
ALTER TABLE notification RENAME COLUMN "createdAt" TO created_at;

-- 11. Rename columns: health_score_log
ALTER TABLE health_score_log RENAME COLUMN "companyId" TO company_id;
ALTER TABLE health_score_log RENAME COLUMN "calculatedAt" TO calculated_at;

-- ============================================================
-- Add updated_at auto-trigger for tables that need it
-- (replaces Prisma's @updatedAt behaviour)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_company
  BEFORE UPDATE ON company
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_blocker
  BEFORE UPDATE ON blocker
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
