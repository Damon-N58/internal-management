"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createTicket(companyId: string, title: string) {
  const ticket = await prisma.ticket.create({
    data: {
      title,
      status: "Open",
      companyId,
    },
  })
  revalidatePath(`/clients/${companyId}`)
  return ticket
}

export async function updateTicketStatus(ticketId: string, companyId: string, status: string) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status },
  })
  revalidatePath(`/clients/${companyId}`)
  return ticket
}
