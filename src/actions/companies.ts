"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { applyHealthScore } from "@/lib/apply-health-score"
import type { CompanyStatus } from "@/types"

function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25)
}

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

export async function updateGoogleDriveUrl(companyId: string, url: string) {
  await supabase
    .from("company")
    .update({ google_drive_url: url || null })
    .eq("id", companyId)

  revalidatePath(`/clients/${companyId}`)
}

export async function createCompany(data: {
  name: string
  status: string
  primary_csm: string
  implementation_lead?: string | null
  second_lead?: string | null
  third_lead?: string | null
  contract_end_date?: string | null
  website?: string | null
}): Promise<{ id?: string; error?: string }> {
  const id = genId()
  const clean = (v?: string | null) => (!v || v === "_none" ? null : v)
  const now = new Date().toISOString()

  const { error } = await supabase.from("company").insert({
    id,
    name: data.name,
    status: data.status,
    primary_csm: data.primary_csm,
    implementation_lead: clean(data.implementation_lead) ?? "",
    second_lead: clean(data.second_lead),
    third_lead: clean(data.third_lead),
    contract_end_date: data.contract_end_date || null,
    website: data.website || null,
    health_score: 5,
    priority: 3,
    created_at: now,
    updated_at: now,
  })

  if (error) return { error: error.message }

  await writeActivityLog(id, `Company "${data.name}" created`, "Automated")
  revalidatePath("/")
  revalidatePath("/clients")
  return { id }
}

export async function updateCompanyStaff(
  companyId: string,
  field: "primary_csm" | "implementation_lead" | "second_lead" | "third_lead",
  value: string | null
) {
  await supabase
    .from("company")
    .update({ [field]: value ?? null })
    .eq("id", companyId)

  revalidatePath("/settings")
  revalidatePath("/clients")
  revalidatePath(`/clients/${companyId}`)
}

export async function recalculateCompanyHealth(companyId: string) {
  const result = await applyHealthScore(companyId)
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return result
}
