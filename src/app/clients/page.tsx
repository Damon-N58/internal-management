import { supabase } from "@/lib/supabase"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import { AddCompanyDialog } from "@/components/clients/add-company-dialog"
import { getFaviconUrl } from "@/lib/favicon"

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
          companies.map((company) => {
            const favicon = getFaviconUrl(company.website)
            return (
              <Link key={company.id} href={`/clients/${company.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      {favicon ? (
                        <Image
                          src={favicon}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-sm"
                          unoptimized
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-sm bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium">{company.name}</span>
                      <span className="text-sm text-muted-foreground">
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
            )
          })
        )}
      </div>
    </div>
  )
}
