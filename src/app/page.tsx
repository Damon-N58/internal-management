import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientTable } from "@/components/dashboard/client-table"
import { AttentionSection } from "@/components/dashboard/attention-section"
import { generateNotifications } from "@/actions/notifications"
import { addDays } from "date-fns"

export default async function DashboardPage() {
  await generateNotifications()

  const [companies, upcomingDeadlines, highPriorityPCRs] = await Promise.all([
    prisma.company.findMany({
      include: {
        deadlines: true,
        activityLogs: { take: 1, orderBy: { createdAt: "desc" } },
        blockers: true,
        tickets: true,
      },
      orderBy: { healthScore: "asc" },
    }),
    prisma.deadline.findMany({
      where: { dueDate: { lte: addDays(new Date(), 7) } },
    }),
    prisma.productChangeRequest.findMany({
      where: { priority: { lte: 2 }, status: { not: "Completed" } },
    }),
  ])

  const activeClients = companies.filter((c) => c.status === "Active").length
  const pocClients = companies.filter((c) => c.status === "POC").length
  const totalOpenBlockers = companies.reduce(
    (sum, c) => sum + c.blockers.filter((b) => b.status === "Open").length,
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
