"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import type { KBEntryType } from "@/types"

type CreateKBEntryData = {
  title: string
  type: KBEntryType
  content?: string
  url?: string
}

export async function createKBEntry(companyId: string, data: CreateKBEntryData) {
  const { data: entry } = await supabase
    .from("knowledge_base_entry")
    .insert({
      title: data.title,
      type: data.type,
      content: data.content ?? null,
      url: data.url ?? null,
      company_id: companyId,
    })
    .select()
    .single()

  await writeActivityLog(companyId, `Knowledge base entry added: "${data.title}"`, "Automated")
  revalidatePath(`/clients/${companyId}`)
  return entry
}

export async function deleteKBEntry(entryId: string, companyId: string) {
  await supabase.from("knowledge_base_entry").delete().eq("id", entryId)
  revalidatePath(`/clients/${companyId}`)
}
