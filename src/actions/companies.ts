"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { applyHealthScore } from "@/lib/apply-health-score"
import type { CompanyStatus } from "@/types"

export async function updateCompanyStatus(companyId: string, status: CompanyStatus) {
  const current = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  })
  await prisma.company.update({
    where: { id: companyId },
    data: { status },
  })
  if (current && current.status !== status) {
    await writeActivityLog(
      companyId,
      `Status changed: ${current.status} → ${status}`,
      "Automated"
    )
  }
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
}

export async function recalculateCompanyHealth(companyId: string) {
  const result = await applyHealthScore(companyId)
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return result
}
