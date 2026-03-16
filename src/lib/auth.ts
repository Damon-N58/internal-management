import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Profile, UserRole } from "@/types"

export async function getCurrentUser(): Promise<Profile | null> {
  const user = await currentUser()
  if (!user) return null

  const { data: profile, error: fetchErr } = await supabase
    .from("profile")
    .select()
    .eq("id", user.id)
    .single()

  if (fetchErr && fetchErr.code !== "PGRST116") {
    console.error("[auth] profile fetch error:", fetchErr.message)
  }
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
      const { error: mergeErr } = await supabase.from("profile").upsert(
        {
          id: user.id,
          email,
          full_name: seeded.full_name || fullName,
          role: seeded.role || role,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id", ignoreDuplicates: true }
      )
      if (mergeErr) console.error("[auth] profile merge upsert error:", mergeErr.message)

      // Re-key any company assignments from the placeholder ID to the real Clerk ID
      const { error: rekeyErr } = await supabase
        .from("user_company_assignment")
        .update({ user_id: user.id })
        .eq("user_id", seeded.id)
      if (rekeyErr) console.error("[auth] assignment re-key error:", rekeyErr.message)

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
  const { error: upsertErr } = await supabase.from("profile").upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: true }
  )
  if (upsertErr) console.error("[auth] profile create error:", upsertErr.message)

  const { data: created } = await supabase
    .from("profile")
    .select()
    .eq("id", user.id)
    .single()

  return created ?? null
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentUser()
  if (!profile) notFound()
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
