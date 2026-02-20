"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { requireAuth, isAdmin } from "@/lib/auth"
import type { UserRole } from "@/types"

export async function inviteUser(email: string, fullName: string, role: UserRole) {
  const profile = await requireAuth()
  if (!isAdmin(profile)) throw new Error("Admin only")

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID().slice(0, 12),
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) throw new Error(error.message)

  if (data.user) {
    await supabase
      .from("profile")
      .update({ full_name: fullName, role })
      .eq("id", data.user.id)
  }

  revalidatePath("/settings")
  return data.user
}

export async function updateUserRole(userId: string, role: UserRole) {
  const profile = await requireAuth()
  if (!isAdmin(profile)) throw new Error("Admin only")

  await supabase
    .from("profile")
    .update({ role })
    .eq("id", userId)

  revalidatePath("/settings")
}

export async function updateProfileName(name: string) {
  const profile = await requireAuth()

  await supabase
    .from("profile")
    .update({ full_name: name })
    .eq("id", profile.id)

  revalidatePath("/settings")
  revalidatePath("/")
}

export async function getAllProfiles() {
  const { data } = await supabase
    .from("profile")
    .select()
    .order("full_name", { ascending: true })

  return data ?? []
}
