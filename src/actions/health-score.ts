"use server"

import { applyHealthScore } from "@/lib/apply-health-score"
import { revalidatePath } from "next/cache"

export async function recalculateHealthScore(companyId: string) {
  const result = await applyHealthScore(companyId)
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return result
}
