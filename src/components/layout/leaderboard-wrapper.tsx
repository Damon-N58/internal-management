import { supabase } from "@/lib/supabase"
import { LeaderboardButton } from "./leaderboard-button"
import { differenceInDays } from "date-fns"

export async function LeaderboardWrapper() {
  const [{ data: profiles }, { data: tickets }] = await Promise.all([
    supabase.from("profile").select("id, full_name, email"),
    supabase.from("ticket").select("id, status, assigned_to, estimated_hours, actual_hours, closed_at"),
  ])

  if (!profiles || !tickets) return null

  const employees = profiles.map((p) => {
    const myTickets = tickets.filter((t) => t.assigned_to === p.id)
    const closed = myTickets.filter((t) => t.status === "Closed")
    const hoursLogged = closed.reduce((s, t) => s + (t.actual_hours ?? 0), 0)
    const estimatedTotal = closed.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
    const efficiency = estimatedTotal > 0
      ? Math.min(200, (estimatedTotal / Math.max(hoursLogged, 0.1)) * 100)
      : closed.length > 0 ? 100 : 0

    // Streak: count consecutive recent closed tickets (within last 7 days)
    const recentClosed = closed
      .filter((t) => t.closed_at && differenceInDays(new Date(), new Date(t.closed_at)) <= 7)
    const streak = recentClosed.length

    return {
      id: p.id,
      name: p.full_name || p.email,
      ticketsClosed: closed.length,
      hoursLogged: Math.round(hoursLogged * 10) / 10,
      efficiencyScore: Math.round(efficiency),
      streak,
    }
  })

  return <LeaderboardButton employees={employees} />
}
