import { supabase } from "@/lib/supabase"
import { requireAuth, getUserCompanyIds, isAdmin, isManagerOrAbove } from "@/lib/auth"
import { AddCompanyDialog } from "@/components/clients/add-company-dialog"
import { ClientsList } from "@/components/clients/clients-list"
import { ArchivedCompaniesList } from "@/components/clients/archived-companies-list"

export default async function ClientsPage() {
  const profile = await requireAuth()
  const admin = isAdmin(profile)
  const managerOrAbove = isManagerOrAbove(profile)

  const [myCompanyIdsResult, companiesResult, profilesResult, archivedResult] = await Promise.all([
    getUserCompanyIds(profile.id),
    managerOrAbove
      ? supabase.from("company").select("*, blocker(*)").eq("is_archived", false).order("name", { ascending: true })
      : null,
    managerOrAbove
      ? supabase.from("profile").select("id, full_name, email").order("full_name", { ascending: true })
      : null,
    managerOrAbove
      ? supabase.from("company").select("id, name, primary_csm, archived_at").eq("is_archived", true).order("archived_at", { ascending: false })
      : null,
  ])

  const myCompanyIds = myCompanyIdsResult

  const allCompanies = managerOrAbove
    ? (companiesResult?.data ?? [])
    : (await supabase
        .from("company")
        .select("*, blocker(*)")
        .eq("is_archived", false)
        .in("id", myCompanyIds.length > 0 ? myCompanyIds : ["_none"])
        .order("name", { ascending: true })
      ).data ?? []

  const profiles = profilesResult?.data ?? []
  const archivedCompanies = archivedResult?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            {managerOrAbove ? "Manage client accounts" : "Your assigned client accounts"}
          </p>
        </div>
        {managerOrAbove && <AddCompanyDialog profiles={profiles} />}
      </div>
      <ClientsList
        allCompanies={allCompanies as never}
        myCompanyIds={myCompanyIds}
        isManagerOrAbove={managerOrAbove}
      />
      {managerOrAbove && (
        <ArchivedCompaniesList companies={archivedCompanies as never} />
      )}
    </div>
  )
}
