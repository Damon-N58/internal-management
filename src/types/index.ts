export type {
  Company,
  TechnicalVault,
  ActivityLog,
  Ticket,
  Deadline,
  ProductChangeRequest,
} from "@prisma/client"

export type CompanyStatus = "POC" | "Implementation" | "Active" | "Churn Risk"
export type TicketStatus = "Open" | "Blocked" | "Closed"
export type PCRStatus = "Requested" | "In Progress" | "Completed"
export type PCRIssueType = "Feature" | "Issue"
export type PCRLocation = "UI" | "Functionality"
export type ActivityLogType = "Email" | "Note" | "Automated"
export type HealthScore = 1 | 2 | 3 | 4 | 5
