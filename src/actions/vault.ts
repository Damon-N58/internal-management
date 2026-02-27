"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25)
}

export async function saveVault(
  companyId: string,
  data: {
    ftp_info?: string | null
    api_keys?: string | null
    ssh_config?: string | null
    other_secrets?: string | null
  }
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("technical_vault")
    .select("id")
    .eq("company_id", companyId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from("technical_vault")
      .update({
        ftp_info: data.ftp_info ?? null,
        api_keys: data.api_keys ?? null,
        ssh_config: data.ssh_config ?? null,
        other_secrets: data.other_secrets ?? null,
      })
      .eq("company_id", companyId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from("technical_vault").insert({
      id: genId(),
      company_id: companyId,
      ftp_info: data.ftp_info ?? null,
      api_keys: data.api_keys ?? null,
      ssh_config: data.ssh_config ?? null,
      other_secrets: data.other_secrets ?? null,
    })
    if (error) return { error: error.message }
  }

  revalidatePath(`/clients/${companyId}`)
  return {}
}
