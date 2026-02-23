import { supabase } from "@/lib/supabase"
import { requireAuth, isAdmin } from "@/lib/auth"
import { notFound } from "next/navigation"
import { AnalyticsView } from "@/components/analytics/analytics-view"

export default async function AnalyticsPage() {
  const profile = await requireAuth()
  if (!isAdmin(profile)) notFound()

  const [{ data: profiles }, { data: tickets }, { data: assignments }] = await Promise.all([
    supabase.from("profile").select("id, full_name, email, role"),
    supabase.from("ticket").select("id, title, status, priority, assigned_to, estimated_hours, actual_hours, closed_at, created_at, company_id"),
    supabase.from("user_company_assignment").select("user_id, company_id"),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team Analytics</h2>
        <p className="text-muted-foreground">Employee performance and ticket metrics</p>
      </div>
      <AnalyticsView
        profiles={profiles ?? []}
        tickets={tickets ?? []}
        assignments={assignments ?? []}
      />
    </div>
  )
}
