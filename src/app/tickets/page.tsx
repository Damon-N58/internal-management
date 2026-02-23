import { supabase } from "@/lib/supabase"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import { TicketsKanban } from "@/components/tickets/tickets-kanban"

export default async function TicketsPage() {
  const profile = await requireAuth()
  const admin = isAdmin(profile)
  const companyIds = admin ? null : await getUserCompanyIds(profile.id)

  let ticketQuery = supabase
    .from("ticket")
    .select("*, company:company_id(id, name)")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })

  let companyQuery = supabase
    .from("company")
    .select("id, name")
    .order("name", { ascending: true })

  if (companyIds) {
    ticketQuery = ticketQuery.in("company_id", companyIds)
    companyQuery = companyQuery.in("id", companyIds)
  }

  const [{ data: tickets }, { data: profiles }, { data: companies }] = await Promise.all([
    ticketQuery,
    supabase.from("profile").select("id, full_name, email"),
    companyQuery,
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

  const companyList = (companies ?? []).map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
        <p className="text-muted-foreground">All tickets across your clients</p>
      </div>
      <TicketsKanban
        tickets={ticketsWithCompany}
        teamMembers={teamMembers}
        companies={companyList}
      />
    </div>
  )
}
