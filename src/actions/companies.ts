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
  implementation_lead: string
  contract_end_date?: string
  website?: string
}) {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 25)

  const { error } = await supabase.from("company").insert({
    id,
    name: data.name,
    status: data.status,
    primary_csm: data.primary_csm,
    implementation_lead: data.implementation_lead,
    contract_end_date: data.contract_end_date || null,
    website: data.website || null,
    health_score: 5,
    priority: 3,
  })

  if (error) throw new Error(error.message)

  await writeActivityLog(id, `Company "${data.name}" created`, "Automated")
  revalidatePath("/")
  revalidatePath("/clients")
  return id
}

export async function recalculateCompanyHealth(companyId: string) {
  const result = await applyHealthScore(companyId)
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return result
}
