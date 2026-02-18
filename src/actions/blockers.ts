"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { applyHealthScore } from "@/lib/apply-health-score"
import type { BlockerCategory } from "@/types"

type CreateBlockerData = {
  title: string
  description?: string
  category: BlockerCategory
  owner: string
  resolutionDeadline?: Date
}

export async function createBlocker(companyId: string, data: CreateBlockerData) {
  const blocker = await prisma.blocker.create({
    data: { ...data, companyId, status: "Open" },
  })
  await writeActivityLog(companyId, `Blocker created: "${data.title}" (${data.category})`, "Automated")
  await applyHealthScore(companyId)
  revalidatePath(`/clients/${companyId}`)
  return blocker
}

export async function resolveBlocker(blockerId: string, companyId: string) {
  const blocker = await prisma.blocker.update({
    where: { id: blockerId },
    data: { status: "Resolved", resolvedAt: new Date() },
  })
  await writeActivityLog(companyId, `Blocker resolved: "${blocker.title}"`, "Automated")
  await applyHealthScore(companyId)
  revalidatePath(`/clients/${companyId}`)
  return blocker
}

export async function escalateStaleBlockers() {
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  await prisma.blocker.updateMany({
    where: {
      status: "Open",
      updatedAt: { lt: fiveDaysAgo },
      escalationLevel: { lt: 1 },
    },
    data: { escalationLevel: 1 },
  })
}
