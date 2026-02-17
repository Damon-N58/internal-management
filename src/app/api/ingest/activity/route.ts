import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

  const company = await prisma.company.findUnique({
    where: { name: companyName },
  })

  if (!company) {
    return NextResponse.json({ error: `Company '${companyName}' not found` }, { status: 404 })
  }

  const log = await prisma.activityLog.create({
    data: {
      content,
      type,
      companyId: company.id,
    },
  })

  return NextResponse.json(log, { status: 200 })
}
