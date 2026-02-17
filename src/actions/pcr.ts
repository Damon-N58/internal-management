"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { PCRIssueType, PCRLocation } from "@/types"

type CreatePCRData = {
  issue: PCRIssueType
  description: string
  location: PCRLocation
  priority: number
  requestedBy: string
  assignedTo?: string
  deadline?: Date
}

export async function createPCR(data: CreatePCRData) {
  const pcr = await prisma.productChangeRequest.create({
    data: {
      ...data,
      status: "Requested",
    },
  })
  revalidatePath("/product")
  return pcr
}

export async function updatePCRStatus(pcrId: string, status: string) {
  const pcr = await prisma.productChangeRequest.update({
    where: { id: pcrId },
    data: {
      status,
      completedAt: status === "Completed" ? new Date() : null,
    },
  })
  revalidatePath("/product")
  return pcr
}
