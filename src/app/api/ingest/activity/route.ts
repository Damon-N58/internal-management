import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { companyName, content, type } = body as {
    companyName: string
    content: string
    type: string
  }

  if (!companyName || !content || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: company } = await supabase
    .from("company")
    .select("id")
    .eq("name", companyName)
    .single()

  if (!company) {
    return NextResponse.json({ error: `Company '${companyName}' not found` }, { status: 404 })
  }

  const { data: log } = await supabase
    .from("activity_log")
    .insert({
      content,
      type,
      company_id: company.id,
    })
    .select()
    .single()

  return NextResponse.json(log, { status: 200 })
}
