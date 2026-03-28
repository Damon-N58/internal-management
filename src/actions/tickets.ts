"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { writeActivityLog } from "@/actions/activity-logs"
import { requireAuth } from "@/lib/auth"

function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25)
}

type CreateTicketData = {
  title: string
  description?: string
  priority?: number
  assigned_to?: string | null
  due_date?: string | null
  estimated_hours?: number | null
}

export async function createTicket(
  companyId: string,
  data: CreateTicketData
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("ticket")
    .insert({
      id: genId(),
      title: data.title,
      description: data.description || null,
      priority: data.priority ?? 3,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours || null,
      status: "Open",
      company_id: companyId,
      created_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }

  await writeActivityLog(companyId, `Ticket created: "${data.title}"`, "Automated")
  revalidatePath(`/clients/${companyId}`)
  revalidatePath("/tickets")
  return {}
}

export async function updateTicketStatus(ticketId: string, companyId: string, status: string, actualHours?: number): Promise<{ error?: string }> {
  const updateData: Record<string, unknown> = { status }
  if (status === "Closed") {
    updateData.closed_at = new Date().toISOString()
    if (actualHours !== undefined) {
      updateData.actual_hours = actualHours
    }
  }

  const { data: ticket, error } = await supabase
    .from("ticket")
    .update(updateData)
    .eq("id", ticketId)
    .select()
    .single()

  if (error) return { error: error.message }

  await writeActivityLog(
    companyId,
    `Ticket "${ticket?.title}" status changed to ${status}`,
    "Automated"
  )
  revalidatePath(`/clients/${companyId}`)
  revalidatePath("/tickets")
  return {}
}

export async function updateTicket(
  ticketId: string,
  companyId: string,
  data: Partial<CreateTicketData>
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("ticket")
    .update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.assigned_to !== undefined && { assigned_to: data.assigned_to || null }),
      ...(data.due_date !== undefined && { due_date: data.due_date || null }),
      ...(data.estimated_hours !== undefined && { estimated_hours: data.estimated_hours }),
    })
    .eq("id", ticketId)

  if (error) return { error: error.message }
  revalidatePath(`/clients/${companyId}`)
  revalidatePath("/tickets")
  return {}
}

export async function deleteTicket(ticketId: string, companyId: string): Promise<{ error?: string }> {
  const { data: ticket } = await supabase
    .from("ticket")
    .select("title")
    .eq("id", ticketId)
    .single()

  const { error } = await supabase
    .from("ticket")
    .delete()
    .eq("id", ticketId)

  if (error) return { error: error.message }

  await writeActivityLog(companyId, `Ticket deleted: "${ticket?.title}"`, "Automated")
  revalidatePath(`/clients/${companyId}`)
  revalidatePath("/tickets")
  return {}
}

export async function addTicketComment(ticketId: string, companyId: string, content: string): Promise<{ error?: string }> {
  const profile = await requireAuth()

  const { error } = await supabase.from("ticket_comment").insert({
    ticket_id: ticketId,
    author_id: profile.id,
    content,
  })

  if (error) return { error: error.message }
  revalidatePath(`/clients/${companyId}`)
  return {}
}

export async function getTicketComments(ticketId: string) {
  const { data } = await supabase
    .from("ticket_comment")
    .select("*, profile:author_id(full_name, email)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function addTicketMember(ticketId: string, userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("ticket_members")
    .upsert({ id: genId(), ticket_id: ticketId, user_id: userId }, { onConflict: "ticket_id,user_id" })

  if (error) return { error: error.message }
  return {}
}

export async function removeTicketMember(ticketId: string, userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("ticket_members")
    .delete()
    .eq("ticket_id", ticketId)
    .eq("user_id", userId)

  if (error) return { error: error.message }
  return {}
}

export async function getTicketMembers(ticketId: string) {
  const { data } = await supabase
    .from("ticket_members")
    .select("id, user_id, profile:user_id(full_name, email)")
    .eq("ticket_id", ticketId)

  return (data ?? []) as {
    id: string
    user_id: string
    profile: { full_name: string | null; email: string } | null
  }[]
}
