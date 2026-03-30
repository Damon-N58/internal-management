"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { addDays, differenceInDays } from "date-fns"

export async function generateNotifications() {
  const [{ data: companies }, { data: blockers }] = await Promise.all([
    supabase
      .from("company")
      .select("id, name, contract_end_date, health_score, last_activity_at"),
    supabase
      .from("blocker")
      .select("id, title, company_id, created_at, updated_at")
      .eq("status", "Open"),
  ])

  if (!companies || !blockers) return

  const sevenDaysAgo = addDays(new Date(), -7).toISOString()

  const { data: existingRecent } = await supabase
    .from("notification")
    .select("type, company_id")
    .gte("created_at", sevenDaysAgo)

  const existingKeys = new Set(
    (existingRecent ?? []).map((n) => `${n.type}:${n.company_id ?? "global"}`)
  )

  const toCreate: {
    type: string
    message: string
    priority: number
    company_id?: string
  }[] = []

  const sixtyDaysOut = addDays(new Date(), 60)

  for (const company of companies) {
    if (
      company.contract_end_date &&
      new Date(company.contract_end_date) < sixtyDaysOut &&
      !existingKeys.has(`CONTRACT_EXPIRY:${company.id}`)
    ) {
      const daysLeft = differenceInDays(new Date(company.contract_end_date), new Date())
      toCreate.push({
        type: "CONTRACT_EXPIRY",
        message: `${company.name}: contract expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        priority: daysLeft <= 14 ? 1 : 2,
        company_id: company.id,
      })
    }

    if (
      company.health_score <= 2 &&
      !existingKeys.has(`HEALTH_DROP:${company.id}`)
    ) {
      toCreate.push({
        type: "HEALTH_DROP",
        message: `${company.name}: health score dropped to ${company.health_score}/5`,
        priority: 1,
        company_id: company.id,
      })
    }

    const daysSinceActivity = company.last_activity_at
      ? differenceInDays(new Date(), new Date(company.last_activity_at))
      : null

    if (
      (daysSinceActivity === null || daysSinceActivity > 30) &&
      !existingKeys.has(`NO_ACTIVITY:${company.id}`)
    ) {
      toCreate.push({
        type: "NO_ACTIVITY",
        message: `${company.name}: no activity logged in ${daysSinceActivity ?? "30+"} days`,
        priority: 2,
        company_id: company.id,
      })
    }
  }

  for (const blocker of blockers) {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(blocker.updated_at))
    if (
      daysSinceUpdate > 5 &&
      !existingKeys.has(`STALE_BLOCKER:${blocker.company_id}`)
    ) {
      toCreate.push({
        type: "STALE_BLOCKER",
        message: `Stale blocker: "${blocker.title}" — no update in ${daysSinceUpdate} days`,
        priority: 2,
        company_id: blocker.company_id,
      })
    }
  }

  if (toCreate.length > 0) {
    await supabase.from("notification").insert(toCreate)
  }
}

export async function markNotificationRead(id: string) {
  await supabase.from("notification").update({ is_read: true }).eq("id", id)
  revalidatePath("/")
}

export async function markAllNotificationsRead(userId: string) {
  await supabase
    .from("notification")
    .update({ is_read: true })
    .eq("is_read", false)
    .or(`user_id.eq.${userId},user_id.is.null`)
  revalidatePath("/")
}

// Notify all participants on a ticket (assigned_to + members) except the actor
export async function notifyTicketParticipants({
  ticketId,
  companyId,
  type,
  message,
  actorId,
}: {
  ticketId: string
  companyId: string
  type: string
  message: string
  actorId?: string | null
}) {
  const [{ data: ticket }, { data: members }, { data: companyAssignees }] = await Promise.all([
    supabase.from("ticket").select("assigned_to").eq("id", ticketId).single(),
    supabase.from("ticket_members").select("user_id").eq("ticket_id", ticketId),
    supabase.from("user_company_assignment").select("user_id").eq("company_id", companyId),
  ])

  const recipientSet = new Set<string>()
  if (ticket?.assigned_to) recipientSet.add(ticket.assigned_to)
  for (const m of members ?? []) recipientSet.add(m.user_id)
  for (const a of companyAssignees ?? []) recipientSet.add(a.user_id)
  if (actorId) recipientSet.delete(actorId)

  if (recipientSet.size === 0) return

  await supabase.from("notification").insert(
    Array.from(recipientSet).map((uid) => ({
      type,
      message,
      priority: 2,
      company_id: companyId,
      ticket_id: ticketId,
      user_id: uid,
    }))
  )
}
