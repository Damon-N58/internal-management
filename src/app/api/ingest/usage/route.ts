import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

  const company = await prisma.company.findUnique({
    where: { name: companyName },
  })

  if (!company) {
    return NextResponse.json({ error: `Company '${companyName}' not found` }, { status: 404 })
  }

  await prisma.company.update({
    where: { id: company.id },
    data: { conversationVolume },
  })

  await prisma.activityLog.create({
    data: {
      companyId: company.id,
      content: `Usage data ingested: ${conversationVolume} conversations`,
      type: "Automated",
    },
  })

  const result = await applyHealthScore(company.id)

  return NextResponse.json(
    { companyId: company.id, conversationVolume, newHealthScore: result?.score },
    { status: 200 }
  )
}
