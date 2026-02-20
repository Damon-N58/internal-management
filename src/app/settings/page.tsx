import { supabase } from "@/lib/supabase"
import { requireAuth, isAdmin, isManagerOrAbove } from "@/lib/auth"
import { getAllProfiles } from "@/actions/team"
import { getAssignments } from "@/actions/assignments"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export default async function SettingsPage() {
  const profile = await requireAuth()
  const profiles = await getAllProfiles()
  const admin = isAdmin(profile)
  const managerOrAbove = isManagerOrAbove(profile)

  let assignments: Awaited<ReturnType<typeof getAssignments>> = []
  let companies: { id: string; name: string }[] = []

  if (admin) {
    assignments = await getAssignments()
    const { data } = await supabase
      .from("company")
      .select("id, name")
      .order("name", { ascending: true })
    companies = (data ?? []) as { id: string; name: string }[]
  }

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
