"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { requireAuth, isAdmin } from "@/lib/auth"

export async function assignUserToCompany(userId: string, companyId: string) {
  const profile = await requireAuth()
  if (!isAdmin(profile)) throw new Error("Admin only")

  await supabase.from("user_company_assignment").upsert(
    { user_id: userId, company_id: companyId },
    { onConflict: "user_id,company_id" }
  )

  revalidatePath("/settings")
  revalidatePath("/")
}

export async function unassignUserFromCompany(userId: string, companyId: string) {
  const profile = await requireAuth()
  if (!isAdmin(profile)) throw new Error("Admin only")

  await supabase
    .from("user_company_assignment")
    .delete()
    .eq("user_id", userId)
    .eq("company_id", companyId)

  revalidatePath("/settings")
  revalidatePath("/")
}

export async function getAssignments() {
  const { data } = await supabase
    .from("user_company_assignment")
    .select("*, profile:user_id(id, full_name, email), company:company_id(id, name)")
    .order("created_at", { ascending: false })

  return data ?? []
}
