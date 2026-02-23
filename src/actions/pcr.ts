"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { PCRIssueType, PCRLocation } from "@/types"

function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25)
}

type CreatePCRData = {
  issue: PCRIssueType
  description: string
  location: PCRLocation
  priority: number
  requestedBy: string
  assignedTo?: string
  deadline?: Date
}

export async function createPCR(data: CreatePCRData): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("product_change_request")
    .insert({
      id: genId(),
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

  if (error) return { error: error.message }

  revalidatePath("/product")
  return {}
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
