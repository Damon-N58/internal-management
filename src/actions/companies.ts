"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { applyHealthScore } from "@/lib/apply-health-score"
import type { CompanyStatus } from "@/types"

function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25)
}

async function syncCompanyAssignments(companyId: string, names: (string | null | undefined)[]) {
  const validNames = names.filter((n): n is string => !!n && n !== "_none")
  if (validNames.length === 0) return

  const { data: profiles } = await supabase
    .from("profile")
    .select("id")
    .in("full_name", validNames)

  if (!profiles || profiles.length === 0) return

  const { data: existing } = await supabase
    .from("user_company_assignment")
    .select("user_id")
    .eq("company_id", companyId)

  const existingIds = new Set((existing ?? []).map((e) => e.user_id))

  const toInsert = profiles
    .filter((p) => !existingIds.has(p.id))
    .map((p) => ({ id: crypto.randomUUID(), user_id: p.id, company_id: companyId }))

  if (toInsert.length > 0) {
    await supabase.from("user_company_assignment").insert(toInsert)
  }
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

export async function updateCompanyTextField(
  companyId: string,
  field: "current_objectives" | "future_work",
  value: string
) {
  await supabase
    .from("company")
    .update({ [field]: value || null })
    .eq("id", companyId)

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

  await Promise.all([
    writeActivityLog(id, `Company "${data.name}" created`, "Automated"),
    syncCompanyAssignments(id, [
      data.primary_csm,
      data.implementation_lead,
      data.second_lead,
      data.third_lead,
    ]),
  ])

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

  const { data: company } = await supabase
    .from("company")
    .select("primary_csm, implementation_lead, second_lead, third_lead")
    .eq("id", companyId)
    .single()

  if (company) {
    await syncCompanyAssignments(companyId, [
      company.primary_csm,
      company.implementation_lead,
      company.second_lead,
      company.third_lead,
    ])
  }

  revalidatePath("/settings")
  revalidatePath("/clients")
  revalidatePath(`/clients/${companyId}`)
}

export async function updateContractInfo(
  companyId: string,
  data: { contract_start_date: string | null; contract_end_date: string | null }
) {
  await supabase
    .from("company")
    .update({
      contract_start_date: data.contract_start_date,
      contract_end_date: data.contract_end_date,
    })
    .eq("id", companyId)

  revalidatePath(`/clients/${companyId}`)
}

export async function recalculateCompanyHealth(companyId: string) {
  const result = await applyHealthScore(companyId)
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return result
}

export async function updatePipelineStage(companyId: string, stage: string | null): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("company")
    .update({ pipeline_stage: stage })
    .eq("id", companyId)

  if (error) return { error: error.message }
  revalidatePath("/clients")
  revalidatePath(`/clients/${companyId}`)
  return {}
}

export async function updateContractValue(companyId: string, value: number | null): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("company")
    .update({ contract_value: value })
    .eq("id", companyId)

  if (error) return { error: error.message }
  revalidatePath("/clients")
  revalidatePath(`/clients/${companyId}`)
  return {}
}

export async function updateCsmComms(
  companyId: string,
  data: { next_action?: string | null; ball_in_court?: string | null }
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("company")
    .update(data)
    .eq("id", companyId)

  if (error) return { error: error.message }
  revalidatePath(`/clients/${companyId}`)
  return {}
}
