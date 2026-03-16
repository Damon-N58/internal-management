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

  const email = user.emailAddresses[0]?.emailAddress ?? ""
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || email || ""
  const role = ((user.publicMetadata?.role as UserRole) || "Member")

  // Check for a pre-seeded placeholder profile matched by email
  if (email) {
    const { data: seeded } = await supabase
      .from("profile")
      .select()
      .eq("email", email)
      .neq("id", user.id)
      .maybeSingle()

    if (seeded) {
      // Upsert the real profile — idempotent if a concurrent request already created it
      await supabase.from("profile").upsert(
        {
          id: user.id,
          email,
          full_name: seeded.full_name || fullName,
          role: seeded.role || role,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id", ignoreDuplicates: true }
      )

      // Re-key any company assignments from the placeholder ID to the real Clerk ID
      await supabase
        .from("user_company_assignment")
        .update({ user_id: user.id })
        .eq("user_id", seeded.id)

      // Delete the placeholder profile (assignments now point to real ID)
      await supabase.from("profile").delete().eq("id", seeded.id)

      const { data: merged } = await supabase
        .from("profile")
        .select()
        .eq("id", user.id)
        .single()

      return merged ?? null
    }
  }

  // Only allow @nineteen58.co.za accounts — block anyone who isn't on the team
  if (!email.endsWith("@nineteen58.co.za")) return null

  // Auto-create profile on first access — upsert is idempotent if concurrent requests race
  await supabase.from("profile").upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: true }
  )

  const { data: created } = await supabase
    .from("profile")
    .select()
    .eq("id", user.id)
    .single()

  return created ?? null
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
