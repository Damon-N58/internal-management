"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"

export async function createTodo(text: string) {
  const profile = await requireAuth()
  await supabase.from("todo").insert({ text, user_id: profile.id })
  revalidatePath("/")
}

export async function toggleTodo(todoId: string) {
  const profile = await requireAuth()
  const { data: todo } = await supabase
    .from("todo")
    .select("is_completed")
    .eq("id", todoId)
    .eq("user_id", profile.id)
    .single()

  if (!todo) return

  await supabase
    .from("todo")
    .update({ is_completed: !todo.is_completed })
    .eq("id", todoId)
    .eq("user_id", profile.id)

  revalidatePath("/")
}

export async function deleteTodo(todoId: string) {
  const profile = await requireAuth()
  await supabase
    .from("todo")
    .delete()
    .eq("id", todoId)
    .eq("user_id", profile.id)

  revalidatePath("/")
}
