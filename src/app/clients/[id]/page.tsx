import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      vault: true,
      tickets: true,
      activityLogs: { orderBy: { createdAt: "desc" } },
      deadlines: { orderBy: { dueDate: "asc" } },
    },
  })

  if (!company) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{company.name}</h2>
          <div className="mt-2 flex items-center gap-3">
            <HealthBadge score={company.healthScore} />
            <StatusBadge status={company.status} />
            <span className="text-sm text-muted-foreground">CSM: {company.primaryCSM}</span>
            {company.implementationLead && (
              <span className="text-sm text-muted-foreground">
                Lead: {company.implementationLead}
              </span>
            )}
          </div>
        </div>
      </div>

      <ClientDetailTabs company={company} />
    </div>
  )
}
