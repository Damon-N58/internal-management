import { supabase } from "@/lib/supabase"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import { TicketsPageView } from "@/components/tickets/tickets-page-view"
import type { Profile } from "@/types"

export default async function TicketsPage() {
  const profile = await requireAuth()
  const companyIds = isAdmin(profile) ? null : await getUserCompanyIds(profile.id)

  let ticketQuery = supabase
    .from("ticket")
    .select("*, company:company_id(id, name)")
    .order("created_at", { ascending: false })

  if (companyIds) {
    ticketQuery = ticketQuery.in("company_id", companyIds)
  }

  const [{ data: tickets }, { data: profiles }] = await Promise.all([
    ticketQuery,
    supabase.from("profile").select("id, full_name, email"),
  ])

  const ticketsWithCompany = (tickets ?? []).map((t) => ({
    ...t,
    company_name: (t.company as unknown as { name: string })?.name ?? "Unknown",
    company: undefined,
  }))

  const teamMembers = (profiles ?? []).map((p: { id: string; full_name: string; email: string }) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
        <p className="text-muted-foreground">All tickets across your clients</p>
      </div>
      <TicketsPageView tickets={ticketsWithCompany} teamMembers={teamMembers} />
    </div>
  )
}
