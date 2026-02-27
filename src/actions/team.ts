"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { requireAuth, isAdmin } from "@/lib/auth"
import { clerkClient } from "@clerk/nextjs/server"
import type { UserRole } from "@/types"

export async function inviteUser(email: string, role: UserRole) {
  const profile = await requireAuth()
  if (!isAdmin(profile)) throw new Error("Admin only")

  const client = await clerkClient()
  await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role },
    redirectUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "") + "/",
  })

  revalidatePath("/settings")
  return { email }
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
