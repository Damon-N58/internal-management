import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { TodoButton } from "./todo-button"
import type { Todo } from "@/types"

export async function TodoButtonWrapper() {
  const profile = await getCurrentUser()
  if (!profile) return null

  let todos: Todo[] = []

  try {
    const { data } = await supabase
      .from("todo")
      .select()
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    todos = data ?? []
  } catch {
    // DB unavailable
  }

  const incompleteCount = todos.filter((t) => !t.is_completed).length

  return <TodoButton todos={todos} incompleteCount={incompleteCount} />
}
