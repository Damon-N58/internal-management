"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"

export async function createTicket(companyId: string, title: string) {
  const { data: ticket } = await supabase
    .from("ticket")
    .insert({ title, status: "Open", company_id: companyId })
    .select()
    .single()

  await writeActivityLog(companyId, `Ticket created: "${title}"`, "Automated")
  revalidatePath(`/clients/${companyId}`)
  return ticket
}

export async function updateTicketStatus(ticketId: string, companyId: string, status: string) {
  const { data: ticket } = await supabase
    .from("ticket")
    .update({ status })
    .eq("id", ticketId)
    .select()
    .single()

  await writeActivityLog(
    companyId,
    `Ticket "${ticket?.title}" status changed to ${status}`,
    "Automated"
  )
  revalidatePath(`/clients/${companyId}`)
  return ticket
}
