"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { applyHealthScore } from "@/lib/apply-health-score"
import type { CompanyStatus } from "@/types"

export async function updateCompanyStatus(companyId: string, status: CompanyStatus) {
  const { data: current } = await supabase
    .from("company")
    .select("status")
    .eq("id", companyId)
    .single()

  await supabase
    .from("company")
    .update({ status })
    .eq("id", companyId)

  if (current && current.status !== status) {
    await writeActivityLog(
      companyId,
      `Status changed: ${current.status} → ${status}`,
      "Automated"
    )
  }
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
}

export async function recalculateCompanyHealth(companyId: string) {
  const result = await applyHealthScore(companyId)
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return result
}
