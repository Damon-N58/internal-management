"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { CompanyStatus } from "@/types"

export async function updateHealthScore(companyId: string, score: number) {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { healthScore: score },
  })
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return company
}

export async function updateCompanyStatus(companyId: string, status: CompanyStatus) {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { status },
  })
  revalidatePath("/")
  revalidatePath(`/clients/${companyId}`)
  return company
}
