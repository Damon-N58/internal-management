"use server"

import { supabase } from "@/lib/supabase"
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
  const { data: pcr, error } = await supabase
    .from("product_change_request")
    .insert({
      issue: data.issue,
      description: data.description,
      location: data.location,
      priority: data.priority,
      requested_by: data.requestedBy,
      assigned_to: data.assignedTo ?? null,
      deadline: data.deadline?.toISOString() ?? null,
      status: "Requested",
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/product")
  return pcr
}

export async function updatePCRStatus(pcrId: string, status: string) {
  const { data: pcr } = await supabase
    .from("product_change_request")
    .update({
      status,
      completed_at: status === "Completed" ? new Date().toISOString() : null,
    })
    .eq("id", pcrId)
    .select()
    .single()

  revalidatePath("/product")
  return pcr
}
