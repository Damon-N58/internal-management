"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"

export async function getAgentConfigs(companyId: string) {
  const { data } = await supabase
    .from("agent_config")
    .select()
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function createAgentConfig(input: {
  company_id: string
  agent_name: string
  description?: string
  prompt?: string
  channel?: string
  tool_calls?: string
  external_resources?: string
  weekly_tasks?: string
  notes?: string
  sort_order?: number
}) {
  await requireAuth()

  const { data, error } = await supabase
    .from("agent_config")
    .insert({
      company_id: input.company_id,
      agent_name: input.agent_name,
      description: input.description ?? null,
      prompt: input.prompt ?? null,
      channel: input.channel ?? null,
      tool_calls: input.tool_calls ?? null,
      external_resources: input.external_resources ?? null,
      weekly_tasks: input.weekly_tasks ?? null,
      notes: input.notes ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${input.company_id}`)
  return data
}

export async function updateAgentConfig(
  id: string,
  companyId: string,
  input: {
    agent_name?: string
    description?: string
    prompt?: string
    channel?: string
    tool_calls?: string
    external_resources?: string
    weekly_tasks?: string
    notes?: string
    sort_order?: number
  }
) {
  await requireAuth()

  const { error } = await supabase
    .from("agent_config")
    .update({
      agent_name: input.agent_name,
      description: input.description ?? null,
      prompt: input.prompt ?? null,
      channel: input.channel ?? null,
      tool_calls: input.tool_calls ?? null,
      external_resources: input.external_resources ?? null,
      weekly_tasks: input.weekly_tasks ?? null,
      notes: input.notes ?? null,
      sort_order: input.sort_order,
    })
    .eq("id", id)
    .eq("company_id", companyId)

  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${companyId}`)
}

export async function deleteAgentConfig(id: string, companyId: string) {
  await requireAuth()

  const { error } = await supabase
    .from("agent_config")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId)

  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${companyId}`)
}
