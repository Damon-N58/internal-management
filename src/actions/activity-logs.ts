"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActivityLogType } from "@/types"

export async function createActivityLog(
  companyId: string,
  content: string,
  type: ActivityLogType
) {
  const log = await prisma.activityLog.create({
    data: { content, type, companyId },
  })
  revalidatePath(`/clients/${companyId}`)
  return log
}
