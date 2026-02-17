import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"

export default async function ClientsPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
        <p className="text-muted-foreground">All managed client accounts</p>
      </div>
      <div className="grid gap-3">
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clients yet.</p>
        ) : (
          companies.map((company) => (
            <Link key={company.id} href={`/clients/${company.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <span className="font-medium">{company.name}</span>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {company.primaryCSM}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HealthBadge score={company.healthScore} />
                    <StatusBadge status={company.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
