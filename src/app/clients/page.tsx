import { supabase } from "@/lib/supabase"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import { AddCompanyDialog } from "@/components/clients/add-company-dialog"
import { ClientsList } from "@/components/clients/clients-list"

export default async function ClientsPage() {
  const profile = await requireAuth()
  const admin = isAdmin(profile)
  const myCompanyIds = await getUserCompanyIds(profile.id)

  const { data: allCompanies } = admin
    ? await supabase.from("company").select().order("name", { ascending: true })
    : await supabase.from("company").select().in("id", myCompanyIds.length > 0 ? myCompanyIds : ["_none"]).order("name", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            {admin ? "Manage client accounts" : "Your assigned client accounts"}
          </p>
        </div>
        {admin && <AddCompanyDialog />}
      </div>
      <ClientsList
        allCompanies={allCompanies ?? []}
        myCompanyIds={myCompanyIds}
        isAdmin={admin}
      />
    </div>
  )
}
