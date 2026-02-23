import { supabase } from "@/lib/supabase"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import { AddCompanyDialog } from "@/components/clients/add-company-dialog"
import { ClientsList } from "@/components/clients/clients-list"

export default async function ClientsPage() {
  const profile = await requireAuth()
  const admin = isAdmin(profile)

  const [myCompanyIdsResult, companiesResult, profilesResult] = await Promise.all([
    getUserCompanyIds(profile.id),
    admin
      ? supabase.from("company").select().order("name", { ascending: true })
      : null,
    admin
      ? supabase.from("profile").select("id, full_name, email").order("full_name", { ascending: true })
      : null,
  ])

  const myCompanyIds = myCompanyIdsResult

  const allCompanies = admin
    ? (companiesResult?.data ?? [])
    : (await supabase
        .from("company")
        .select()
        .in("id", myCompanyIds.length > 0 ? myCompanyIds : ["_none"])
        .order("name", { ascending: true })
      ).data ?? []

  const profiles = profilesResult?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            {admin ? "Manage client accounts" : "Your assigned client accounts"}
          </p>
        </div>
        {admin && <AddCompanyDialog profiles={profiles} />}
      </div>
      <ClientsList
        allCompanies={allCompanies}
        myCompanyIds={myCompanyIds}
        isAdmin={admin}
      />
    </div>
  )
}
