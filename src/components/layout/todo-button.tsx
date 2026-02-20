"use client"

import { useState } from "react"
import { CheckSquare, Square, Check, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTodo, toggleTodo, deleteTodo } from "@/actions/todos"
import { cn } from "@/lib/utils"
import type { Todo } from "@/types"

type Props = {
  todos: Todo[]
  incompleteCount: number
}

export function TodoButton({ todos, incompleteCount }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const incomplete = todos.filter((t) => !t.is_completed)
  const completed = todos.filter((t) => t.is_completed)

  const handleAdd = async () => {
    if (!text.trim()) return
    setLoading(true)
    await createTodo(text.trim())
    setText("")
    setLoading(false)
  }

  const handleToggle = async (id: string) => {
    await toggleTodo(id)
  }

  const handleDelete = async (id: string) => {
    await deleteTodo(id)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        aria-label="To-do list"
      >
        <CheckSquare className="h-5 w-5" />
        {incompleteCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
            {incompleteCount > 9 ? "9+" : incompleteCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-lg border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">
                To-Do List {incompleteCount > 0 && `(${incompleteCount})`}
              </span>
            </div>

            <div className="border-b px-4 py-3">
              <form
                onSubmit={(e) => { e.preventDefault(); handleAdd() }}
                className="flex gap-2"
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a task..."
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !text.trim()}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {todos.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No tasks yet
                </div>
              ) : (
                <>
                  {incomplete.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-2 px-4 py-2 border-b last:border-b-0 hover:bg-slate-50"
                    >
                      <button
                        onClick={() => handleToggle(todo.id)}
                        className="shrink-0 text-slate-400 hover:text-blue-600"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-sm truncate">{todo.text}</span>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="shrink-0 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {completed.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-2 px-4 py-2 border-b last:border-b-0 opacity-50"
                    >
                      <button
                        onClick={() => handleToggle(todo.id)}
                        className="shrink-0 text-green-500"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-sm truncate line-through">{todo.text}</span>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="shrink-0 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
