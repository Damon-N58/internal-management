import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientTable } from "@/components/dashboard/client-table"
import { addDays } from "date-fns"

export default async function DashboardPage() {
  const [companies, upcomingDeadlines, highPriorityPCRs] = await Promise.all([
    prisma.company.findMany({
      include: {
        deadlines: true,
        activityLogs: { take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { priority: "asc" },
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back to the Nineteen58 Ops Portal</p>
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
              High Priority Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{highPriorityPCRs.length}</div>
          </CardContent>
        </Card>
      </div>

      <ClientTable companies={companies} />
    </div>
  )
}
