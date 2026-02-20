import { createClient } from "@/lib/supabase-server"
import { supabase } from "@/lib/supabase"
import type { Profile, UserRole } from "@/types"

export async function getCurrentUser(): Promise<Profile | null> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profile")
    .select()
    .eq("id", user.id)
    .single()

  return profile ?? null
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentUser()
  if (!profile) {
    throw new Error("Not authenticated")
  }
  return profile
}

export async function getUserCompanyIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("user_company_assignment")
    .select("company_id")
    .eq("user_id", userId)

  return (data ?? []).map((row) => row.company_id)
}

export function isAdmin(profile: Profile): boolean {
  return profile.role === "Admin"
}

export function isManagerOrAbove(profile: Profile): boolean {
  return profile.role === "Admin" || profile.role === "Manager"
}

export type { UserRole }
