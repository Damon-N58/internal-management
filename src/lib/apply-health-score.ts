import { prisma } from "@/lib/prisma"
import { computeHealthScore } from "@/lib/health-score"
import { differenceInDays } from "date-fns"

export async function applyHealthScore(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      healthScore: true,
      lastActivityAt: true,
      conversationVolume: true,
      _count: {
        select: {
          blockers: { where: { status: "Open" } },
        },
      },
    },
  })

  if (!company) return null

  const openPCRCount = await prisma.productChangeRequest.count({
    where: { status: { not: "Completed" } },
  })

  const daysSinceLastActivity = company.lastActivityAt
    ? differenceInDays(new Date(), company.lastActivityAt)
    : null

  const result = computeHealthScore({
    openBlockerCount: company._count.blockers,
    daysSinceLastActivity,
    openPCRCount,
    conversationVolume: company.conversationVolume,
  })

  const oldScore = company.healthScore

  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: { healthScore: result.score },
    }),
    prisma.healthScoreLog.create({
      data: {
        companyId,
        score: result.score,
        breakdown: result.breakdown,
      },
    }),
    ...(oldScore !== result.score
      ? [
          prisma.activityLog.create({
            data: {
              companyId,
              content: `Health score updated: ${oldScore} → ${result.score}`,
              type: "Automated",
            },
          }),
          prisma.company.update({
            where: { id: companyId },
            data: { lastActivityAt: new Date() },
          }),
        ]
      : []),
  ])

  return result
}
