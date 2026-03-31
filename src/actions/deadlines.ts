"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25)
}

export async function createDeadline(
  companyId: string,
  data: { description: string; due_date: string; category?: string }
): Promise<{ error?: string; id?: string }> {
  const id = genId()
  const { error } = await supabase.from("deadline").insert({
    id,
    company_id: companyId,
    description: data.description,
    due_date: data.due_date,
    category: data.category ?? "Milestone",
  })
  if (error) return { error: error.message }
  revalidatePath(`/clients/${companyId}`)
  return { id }
}

export async function updateDeadline(
  id: string,
  companyId: string,
  data: { description?: string; due_date?: string; category?: string }
): Promise<{ error?: string }> {
  const { error } = await supabase.from("deadline").update(data).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/clients/${companyId}`)
  return {}
}

export async function deleteDeadline(
  id: string,
  companyId: string
): Promise<{ error?: string }> {
  const { error } = await supabase.from("deadline").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/clients/${companyId}`)
  return {}
}
