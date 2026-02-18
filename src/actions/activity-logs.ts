"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActivityLogType } from "@/types"

export async function writeActivityLog(
  companyId: string,
  content: string,
  type: ActivityLogType
) {
  await prisma.$transaction([
    prisma.activityLog.create({
      data: { content, type, companyId },
    }),
    prisma.company.update({
      where: { id: companyId },
      data: { lastActivityAt: new Date() },
    }),
  ])
}

export async function createActivityLog(
  companyId: string,
  content: string,
  type: ActivityLogType
) {
  await writeActivityLog(companyId, content, type)
  revalidatePath(`/clients/${companyId}`)
}
