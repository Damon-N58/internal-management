export type {
  Company,
  TechnicalVault,
  ActivityLog,
  Ticket,
  Deadline,
  ProductChangeRequest,
  Blocker,
  KnowledgeBaseEntry,
  Notification,
  HealthScoreLog,
} from "@prisma/client"

export type CompanyStatus = "POC" | "Implementation" | "Active" | "Churn Risk"
export type TicketStatus = "Open" | "Blocked" | "Closed"
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
