import type { Database } from "./database"

export type Company = Database["public"]["Tables"]["company"]["Row"]
export type TechnicalVault = Database["public"]["Tables"]["technical_vault"]["Row"]
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"]
export type Ticket = Database["public"]["Tables"]["ticket"]["Row"]
export type Deadline = Database["public"]["Tables"]["deadline"]["Row"]
export type ProductChangeRequest = Database["public"]["Tables"]["product_change_request"]["Row"]
export type Blocker = Database["public"]["Tables"]["blocker"]["Row"]
export type KnowledgeBaseEntry = Database["public"]["Tables"]["knowledge_base_entry"]["Row"]
export type Notification = Database["public"]["Tables"]["notification"]["Row"]
export type HealthScoreLog = Database["public"]["Tables"]["health_score_log"]["Row"]

export type CompanyStatus = "POC" | "Implementation" | "Active" | "Churn Risk"
export type TicketStatus = "Open" | "In Progress" | "Blocked" | "Closed"
export type PCRStatus = "Requested" | "In Progress" | "Completed"
export type PCRIssueType = "Feature" | "Issue"
export type PCRLocation = "UI" | "Functionality"
export type ActivityLogType = "Email" | "Note" | "Automated"
export type HealthScore = 1 | 2 | 3 | 4 | 5
export type BlockerCategory = "Internal" | "External" | "Technical" | "Commercial"
export type BlockerStatus = "Open" | "Resolved"
export type KBEntryType = "Doc" | "Link" | "Note"
export type NotificationType =
  | "CONTRACT_EXPIRY"
  | "HEALTH_DROP"
  | "STALE_BLOCKER"
  | "NO_ACTIVITY"

export type Profile = Database["public"]["Tables"]["profile"]["Row"]
export type UserCompanyAssignment = Database["public"]["Tables"]["user_company_assignment"]["Row"]
export type TicketComment = Database["public"]["Tables"]["ticket_comment"]["Row"]
export type Todo = Database["public"]["Tables"]["todo"]["Row"]

export type UserRole = "Admin" | "Manager" | "Member"
export type TicketPriority = 1 | 2 | 3 | 4 | 5
