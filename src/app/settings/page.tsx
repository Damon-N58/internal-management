import { supabase } from "@/lib/supabase"
import { requireAuth, isAdmin, isManagerOrAbove } from "@/lib/auth"
import { getAllProfiles } from "@/actions/team"
import { getAssignments } from "@/actions/assignments"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export default async function SettingsPage() {
  const profile = await requireAuth()
  const admin = isAdmin(profile)
  const managerOrAbove = isManagerOrAbove(profile)

  let assignments: Awaited<ReturnType<typeof getAssignments>> = []
  let companies: { id: string; name: string; primary_csm: string; implementation_lead: string; second_lead: string | null; third_lead: string | null }[] = []

  if (admin) {
    const [profiles, assignmentsData, { data: companyData }] = await Promise.all([
      getAllProfiles(),
      getAssignments(),
      supabase.from("company").select("id, name, primary_csm, implementation_lead, second_lead, third_lead").order("name", { ascending: true }),
    ])
    assignments = assignmentsData
    companies = (companyData ?? []) as typeof companies

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Portal configuration and team management</p>
        </div>
        <SettingsTabs
          profile={profile}
          profiles={profiles}
          assignments={assignments}
          companies={companies}
          isAdmin={admin}
          isManagerOrAbove={managerOrAbove}
        />
      </div>
    )
  }

  const profiles = await getAllProfiles()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Portal configuration and team management</p>
      </div>
      <SettingsTabs
        profile={profile}
        profiles={profiles}
        assignments={assignments}
        companies={companies}
        isAdmin={admin}
        isManagerOrAbove={managerOrAbove}
      />
    </div>
  )
}
