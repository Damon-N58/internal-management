"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { applyHealthScore } from "@/lib/apply-health-score"
import type { BlockerCategory } from "@/types"

type CreateBlockerData = {
  title: string
  description?: string
  category: BlockerCategory
  owner: string
  resolutionDeadline?: Date
}

export async function createBlocker(companyId: string, data: CreateBlockerData) {
  const { data: blocker } = await supabase
    .from("blocker")
    .insert({
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      owner: data.owner,
      resolution_deadline: data.resolutionDeadline?.toISOString() ?? null,
      company_id: companyId,
      status: "Open",
    })
    .select()
    .single()

  await writeActivityLog(companyId, `Blocker created: "${data.title}" (${data.category})`, "Automated")
  await applyHealthScore(companyId)
  revalidatePath(`/clients/${companyId}`)
  return blocker
}

export async function resolveBlocker(blockerId: string, companyId: string) {
  const { data: blocker } = await supabase
    .from("blocker")
    .update({ status: "Resolved", resolved_at: new Date().toISOString() })
    .eq("id", blockerId)
    .select()
    .single()

  await writeActivityLog(companyId, `Blocker resolved: "${blocker?.title}"`, "Automated")
  await applyHealthScore(companyId)
  revalidatePath(`/clients/${companyId}`)
  return blocker
}

export async function escalateStaleBlockers() {
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  await supabase
    .from("blocker")
    .update({ escalation_level: 1 })
    .eq("status", "Open")
    .lt("updated_at", fiveDaysAgo)
    .lt("escalation_level", 1)
}
