"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { ActivityLogType } from "@/types"

export async function writeActivityLog(
  companyId: string,
  content: string,
  type: ActivityLogType
) {
  await supabase.from("activity_log").insert({
    content,
    type,
    company_id: companyId,
    created_at: new Date().toISOString(),
  })
  await supabase
    .from("company")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", companyId)
}

export async function createActivityLog(
  companyId: string,
  content: string,
  type: ActivityLogType
) {
  await writeActivityLog(companyId, content, type)
  revalidatePath(`/clients/${companyId}`)
}
