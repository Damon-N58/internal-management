"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import type { KBEntryType } from "@/types"

type CreateKBEntryData = {
  title: string
  type: KBEntryType
  content?: string
  url?: string
}

export async function createKBEntry(companyId: string, data: CreateKBEntryData) {
  const entry = await prisma.knowledgeBaseEntry.create({
    data: { ...data, companyId },
  })
  await writeActivityLog(companyId, `Knowledge base entry added: "${data.title}"`, "Automated")
  revalidatePath(`/clients/${companyId}`)
  return entry
}

export async function deleteKBEntry(entryId: string, companyId: string) {
  await prisma.knowledgeBaseEntry.delete({ where: { id: entryId } })
  revalidatePath(`/clients/${companyId}`)
}
