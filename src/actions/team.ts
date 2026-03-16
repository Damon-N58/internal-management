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

const TEAM_SEED = [
  { full_name: "Danielle Nineteen58", email: "dani@nineteen58.co.za", role: "Member" },
  { full_name: "Damon Carle",         email: "damon@nineteen58.co.za", role: "Member" },
  { full_name: "Dominic le Sueur",    email: "dom@nineteen58.co.za",   role: "Admin" },
  { full_name: "Dreas Vermaak",       email: "dreas@nineteen58.co.za", role: "Member" },
  { full_name: "Erin Duffy",          email: "erin@nineteen58.co.za",  role: "Member" },
  { full_name: "Jan Dreyer",          email: "jan@nineteen58.co.za",   role: "Admin" },
  { full_name: "James MacRobert",     email: "james@nineteen58.co.za", role: "Member" },
  { full_name: "Oliver Rowe",         email: "oliver@nineteen58.co.za",role: "Admin" },
  { full_name: "Renzo Zanetti",       email: "renzo@nineteen58.co.za", role: "Member" },
  { full_name: "Sebastian Mcintosh",  email: "seb@nineteen58.co.za",      role: "Member" },
  { full_name: "Emil Kenguerli",      email: "emil@nineteen58.co.za",     role: "Member" },
  { full_name: "Lamé Labuschagne",    email: "lame@nineteen58.co.za",     role: "Member" },
  { full_name: "Rex le Sueur",        email: "rex@nineteen58.co.za",      role: "Member" },
  { full_name: "Yashmiri Shanmugam",  email: "yashmiri@nineteen58.co.za", role: "Member" },
] as const

export async function seedTeamMembers() {
  const profile = await requireAuth()
  if (!isAdmin(profile)) throw new Error("Admin only")

  const { data: existing } = await supabase.from("profile").select("email")
  const existingEmails = new Set((existing ?? []).map((p) => p.email))

  const toInsert = TEAM_SEED.filter((m) => !existingEmails.has(m.email)).map((m) => ({
    // Use a deterministic placeholder ID — will be re-keyed to the Clerk ID on first sign-in
    id: crypto.randomUUID(),
    email: m.email,
    full_name: m.full_name,
    role: m.role as UserRole,
    created_at: new Date().toISOString(),
  }))

  if (toInsert.length === 0) return { created: 0 }

  const { error } = await supabase.from("profile").insert(toInsert)
  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { created: toInsert.length }
}
