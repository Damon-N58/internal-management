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

export async function markAllNotificationsRead() {
  await supabase.from("notification").update({ is_read: true }).eq("is_read", false)
  revalidatePath("/")
}
