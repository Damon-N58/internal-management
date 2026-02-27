import { currentUser } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import type { Profile, UserRole } from "@/types"

export async function getCurrentUser(): Promise<Profile | null> {
  const user = await currentUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profile")
    .select()
    .eq("id", user.id)
    .single()

  if (profile) return profile

  // Auto-create profile on first access
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses[0]?.emailAddress ||
    ""

  const { data: newProfile } = await supabase
    .from("profile")
    .insert({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      full_name: fullName,
      role: ((user.publicMetadata?.role as UserRole) || "Member"),
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  return newProfile ?? null
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
