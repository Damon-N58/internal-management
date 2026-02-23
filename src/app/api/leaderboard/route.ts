import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { differenceInDays } from "date-fns"

export async function GET() {
  const [{ data: profiles }, { data: tickets }] = await Promise.all([
    supabase.from("profile").select("id, full_name, email"),
    supabase.from("ticket").select("id, status, assigned_to, estimated_hours, actual_hours, closed_at"),
  ])

  if (!profiles || !tickets) {
    return NextResponse.json([])
  }

  const employees = profiles.map((p) => {
    const myTickets = tickets.filter((t) => t.assigned_to === p.id)
    const closed = myTickets.filter((t) => t.status === "Closed")
    const hoursLogged = closed.reduce((s, t) => s + (t.actual_hours ?? 0), 0)
    const estimatedTotal = closed.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
    const efficiency = estimatedTotal > 0
      ? Math.min(200, (estimatedTotal / Math.max(hoursLogged, 0.1)) * 100)
      : closed.length > 0 ? 100 : 0

    const recentClosed = closed.filter(
      (t) => t.closed_at && differenceInDays(new Date(), new Date(t.closed_at)) <= 7
    )

    return {
      id: p.id,
      name: p.full_name || p.email,
      ticketsClosed: closed.length,
      hoursLogged: Math.round(hoursLogged * 10) / 10,
      efficiencyScore: Math.round(efficiency),
      streak: recentClosed.length,
    }
  })

  return NextResponse.json(employees, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
  })
}
