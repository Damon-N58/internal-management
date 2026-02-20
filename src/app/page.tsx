import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientTable } from "@/components/dashboard/client-table"
import { AttentionSection } from "@/components/dashboard/attention-section"
import { generateNotifications } from "@/actions/notifications"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import { addDays } from "date-fns"
import type { Company, Deadline, ActivityLog, Blocker, Ticket } from "@/types"

export type CompanyWithRelations = Company & {
  deadline: Deadline[]
  activity_log: ActivityLog[]
  blocker: Blocker[]
  ticket: Ticket[]
}

export default async function DashboardPage() {
  const profile = await requireAuth()
  const companyIds = isAdmin(profile) ? null : await getUserCompanyIds(profile.id)

  try {
    await generateNotifications()
  } catch {
    // DB unavailable
  }

  let companies: CompanyWithRelations[] = []
  let upcomingDeadlines: Deadline[] = []

  try {
    let query = supabase
      .from("company")
      .select("*, deadline(*), activity_log(*), blocker(*), ticket(*)")
      .order("health_score", { ascending: true })

    if (companyIds) {
      query = query.in("id", companyIds)
    }

    const { data: companyData } = await query

    const sevenDaysOut = addDays(new Date(), 7).toISOString()
    let deadlineQuery = supabase
      .from("deadline")
      .select()
      .lte("due_date", sevenDaysOut)

    if (companyIds) {
      deadlineQuery = deadlineQuery.in("company_id", companyIds)
    }

    const { data: deadlineData } = await deadlineQuery

    companies = (companyData ?? []) as unknown as CompanyWithRelations[]
    upcomingDeadlines = deadlineData ?? []
  } catch {
    // DB unavailable — render empty state
  }

  const activeClients = companies.filter((c) => c.status === "Active").length
  const pocClients = companies.filter((c) => c.status === "POC").length
  const totalOpenBlockers = companies.reduce(
    (sum, c) => sum + (c.blocker ?? []).filter((b) => b.status === "Open").length,
    0
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">What needs your attention today</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current POCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pocClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deadlines (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingDeadlines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Blockers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalOpenBlockers > 0 ? "text-red-600" : "text-green-600"}`}>
              {totalOpenBlockers}
            </div>
          </CardContent>
        </Card>
      </div>

      <AttentionSection companies={companies} />

      <ClientTable companies={companies} />
    </div>
  )
}
