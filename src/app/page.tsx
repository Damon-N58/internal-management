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

  generateNotifications().catch(() => {})

  let companies: CompanyWithRelations[] = []
  let upcomingDeadlines: Deadline[] = []
  let directTickets: Ticket[] = []

  try {
    let companyQuery = supabase
      .from("company")
      .select("*, deadline(*), activity_log(*), blocker(*), ticket(*)")
      .order("health_score", { ascending: true })

    const sevenDaysOut = addDays(new Date(), 7).toISOString()
    let deadlineQuery = supabase
      .from("deadline")
      .select()
      .lte("due_date", sevenDaysOut)

    if (companyIds && companyIds.length > 0) {
      companyQuery = companyQuery.in("id", companyIds)
      deadlineQuery = deadlineQuery.in("company_id", companyIds)
    } else if (companyIds) {
      companyQuery = companyQuery.in("id", ["_none"])
      deadlineQuery = deadlineQuery.in("company_id", ["_none"])
    }

    const [{ data: companyData }, { data: deadlineData }] = await Promise.all([
      companyQuery,
      deadlineQuery,
    ])

    companies = (companyData ?? []) as unknown as CompanyWithRelations[]
    upcomingDeadlines = deadlineData ?? []

    if (companyIds) {
      const { data: myTickets } = await supabase
        .from("ticket")
        .select()
        .eq("assigned_to", profile.id)
        .neq("status", "Closed")
      directTickets = myTickets ?? []
    }
  } catch {
    // DB unavailable — render empty state
  }

  const activeClients = companies.filter((c) => c.status === "Active").length
  const pocClients = companies.filter((c) => c.status === "POC").length
  const totalOpenBlockers = companies.reduce(
    (sum, c) => sum + (c.blocker ?? []).filter((b) => b.status === "Open").length,
    0
  )
  const companyOpenTickets = companies.reduce(
    (sum, c) => sum + (c.ticket ?? []).filter((t) => t.status !== "Closed").length,
    0
  )
  const myDirectTickets = companyIds
    ? directTickets.filter((t) => !companyIds.includes(t.company_id)).length
    : 0
  const totalOpenTickets = companyOpenTickets + myDirectTickets

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">What needs your attention today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalOpenTickets > 0 ? "text-blue-600" : ""}`}>
              {totalOpenTickets}
            </div>
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
