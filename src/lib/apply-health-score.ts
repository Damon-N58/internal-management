import { supabase } from "@/lib/supabase"
import { computeHealthScore } from "@/lib/health-score"
import { differenceInDays } from "date-fns"

export async function applyHealthScore(companyId: string) {
  const [{ data: company }, { count: openBlockerCount }, { count: openPCRCount }] =
    await Promise.all([
      supabase
        .from("company")
        .select("health_score, last_activity_at, conversation_volume")
        .eq("id", companyId)
        .single(),
      supabase
        .from("blocker")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "Open"),
      supabase
        .from("product_change_request")
        .select("id", { count: "exact", head: true })
        .neq("status", "Completed"),
    ])

  if (!company) return null

  const daysSinceLastActivity = company.last_activity_at
    ? differenceInDays(new Date(), new Date(company.last_activity_at))
    : null

  const result = computeHealthScore({
    openBlockerCount: openBlockerCount ?? 0,
    daysSinceLastActivity,
    openPCRCount: openPCRCount ?? 0,
    conversationVolume: company.conversation_volume,
  })

  const oldScore = company.health_score

  await supabase
    .from("company")
    .update({ health_score: result.score })
    .eq("id", companyId)

  await supabase.from("health_score_log").insert({
    company_id: companyId,
    score: result.score,
    breakdown: result.breakdown,
  })

  if (oldScore !== result.score) {
    await supabase.from("activity_log").insert({
      company_id: companyId,
      content: `Health score updated: ${oldScore} → ${result.score}`,
      type: "Automated",
    })
    await supabase
      .from("company")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", companyId)
  }

  return result
}
