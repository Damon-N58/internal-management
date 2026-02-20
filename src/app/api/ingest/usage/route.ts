import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { applyHealthScore } from "@/lib/apply-health-score"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { companyName, conversationVolume } = body as {
    companyName: string
    conversationVolume: number
  }

  if (!companyName || conversationVolume === undefined || conversationVolume === null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (typeof conversationVolume !== "number" || conversationVolume < 0) {
    return NextResponse.json({ error: "conversationVolume must be a non-negative number" }, { status: 400 })
  }

  const { data: company } = await supabase
    .from("company")
    .select("id")
    .eq("name", companyName)
    .single()

  if (!company) {
    return NextResponse.json({ error: `Company '${companyName}' not found` }, { status: 404 })
  }

  await supabase
    .from("company")
    .update({ conversation_volume: conversationVolume })
    .eq("id", company.id)

  await supabase.from("activity_log").insert({
    company_id: company.id,
    content: `Usage data ingested: ${conversationVolume} conversations`,
    type: "Automated",
  })

  const result = await applyHealthScore(company.id)

  return NextResponse.json(
    { companyId: company.id, conversationVolume, newHealthScore: result?.score },
    { status: 200 }
  )
}
