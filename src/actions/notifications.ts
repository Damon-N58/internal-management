"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { addDays, differenceInDays } from "date-fns"

export async function generateNotifications() {
  const [companies, blockers] = await Promise.all([
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        contractEndDate: true,
        healthScore: true,
        lastActivityAt: true,
        healthScoreLogs: {
          take: 2,
          orderBy: { calculatedAt: "desc" },
          select: { score: true, calculatedAt: true },
        },
      },
    }),
    prisma.blocker.findMany({
      where: { status: "Open" },
      select: { id: true, title: true, companyId: true, createdAt: true, updatedAt: true },
    }),
  ])

  const existingUnread = await prisma.notification.findMany({
    where: { isRead: false },
    select: { type: true, companyId: true },
  })

  const existingKeys = new Set(
    existingUnread.map((n) => `${n.type}:${n.companyId ?? "global"}`)
  )

  const toCreate: {
    type: string
    message: string
    priority: number
    companyId?: string
  }[] = []

  const sixtyDaysOut = addDays(new Date(), 60)

  for (const company of companies) {
    if (
      company.contractEndDate &&
      new Date(company.contractEndDate) < sixtyDaysOut &&
      !existingKeys.has(`CONTRACT_EXPIRY:${company.id}`)
    ) {
      const daysLeft = differenceInDays(new Date(company.contractEndDate), new Date())
      toCreate.push({
        type: "CONTRACT_EXPIRY",
        message: `${company.name}: contract expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        priority: daysLeft <= 14 ? 1 : 2,
        companyId: company.id,
      })
    }

    if (
      company.healthScore <= 2 &&
      !existingKeys.has(`HEALTH_DROP:${company.id}`)
    ) {
      toCreate.push({
        type: "HEALTH_DROP",
        message: `${company.name}: health score dropped to ${company.healthScore}/5`,
        priority: 1,
        companyId: company.id,
      })
    }

    const daysSinceActivity = company.lastActivityAt
      ? differenceInDays(new Date(), new Date(company.lastActivityAt))
      : null

    if (
      (daysSinceActivity === null || daysSinceActivity > 30) &&
      !existingKeys.has(`NO_ACTIVITY:${company.id}`)
    ) {
      toCreate.push({
        type: "NO_ACTIVITY",
        message: `${company.name}: no activity logged in ${daysSinceActivity ?? "30+"} days`,
        priority: 2,
        companyId: company.id,
      })
    }
  }

  for (const blocker of blockers) {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(blocker.updatedAt))
    if (
      daysSinceUpdate > 5 &&
      !existingKeys.has(`STALE_BLOCKER:${blocker.companyId}`)
    ) {
      toCreate.push({
        type: "STALE_BLOCKER",
        message: `Stale blocker: "${blocker.title}" — no update in ${daysSinceUpdate} days`,
        priority: 2,
        companyId: blocker.companyId,
      })
    }
  }

  if (toCreate.length > 0) {
    await prisma.notification.createMany({ data: toCreate })
  }
}

export async function markNotificationRead(id: string) {
  await prisma.notification.update({ where: { id }, data: { isRead: true } })
  revalidatePath("/")
}

export async function markAllNotificationsRead() {
  await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } })
  revalidatePath("/")
}
