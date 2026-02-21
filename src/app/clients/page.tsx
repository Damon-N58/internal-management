import { supabase } from "@/lib/supabase"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import { AddCompanyDialog } from "@/components/clients/add-company-dialog"

export default async function ClientsPage() {
  const profile = await requireAuth()
  const admin = isAdmin(profile)
  const companyIds = admin ? null : await getUserCompanyIds(profile.id)

  let query = supabase
    .from("company")
    .select()
    .order("name", { ascending: true })

  if (companyIds) {
    query = query.in("id", companyIds)
  }

  const { data: companies } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            {admin ? "All managed client accounts" : "Your assigned client accounts"}
          </p>
        </div>
        {admin && <AddCompanyDialog />}
      </div>
      <div className="grid gap-3">
        {!companies || companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clients yet.</p>
        ) : (
          companies.map((company) => (
            <Link key={company.id} href={`/clients/${company.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <span className="font-medium">{company.name}</span>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {company.primary_csm}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HealthBadge score={company.health_score} />
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
