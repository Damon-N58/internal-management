"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { requireAuth } from "@/lib/auth"

type CreateTicketData = {
  title: string
  description?: string
  priority?: number
  assigned_to?: string | null
  due_date?: string | null
}

export async function createTicket(companyId: string, data: CreateTicketData) {
  const { data: ticket } = await supabase
    .from("ticket")
    .insert({
      title: data.title,
      description: data.description || null,
      priority: data.priority ?? 3,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      status: "Open",
      company_id: companyId,
    })
    .select()
    .single()

  await writeActivityLog(companyId, `Ticket created: "${data.title}"`, "Automated")
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

export async function updateTicket(
  ticketId: string,
  companyId: string,
  data: Partial<CreateTicketData>
) {
  await supabase
    .from("ticket")
    .update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.assigned_to !== undefined && { assigned_to: data.assigned_to || null }),
      ...(data.due_date !== undefined && { due_date: data.due_date || null }),
    })
    .eq("id", ticketId)

  revalidatePath(`/clients/${companyId}`)
}

export async function addTicketComment(ticketId: string, companyId: string, content: string) {
  const profile = await requireAuth()

  await supabase.from("ticket_comment").insert({
    ticket_id: ticketId,
    author_id: profile.id,
    content,
  })

  revalidatePath(`/clients/${companyId}`)
}

export async function getTicketComments(ticketId: string) {
  const { data } = await supabase
    .from("ticket_comment")
    .select("*, profile:author_id(full_name, email)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })

  return data ?? []
}
