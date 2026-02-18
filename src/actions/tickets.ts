"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"

export async function createTicket(companyId: string, title: string) {
  const ticket = await prisma.ticket.create({
    data: { title, status: "Open", companyId },
  })
  await writeActivityLog(companyId, `Ticket created: "${title}"`, "Automated")
  revalidatePath(`/clients/${companyId}`)
  return ticket
}

export async function updateTicketStatus(ticketId: string, companyId: string, status: string) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status },
  })
  await writeActivityLog(
    companyId,
    `Ticket "${ticket.title}" status changed to ${status}`,
    "Automated"
  )
  revalidatePath(`/clients/${companyId}`)
  return ticket
}
