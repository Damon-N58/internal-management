"use client"

import { useState } from "react"
import { format } from "date-fns"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createActivityLog } from "@/actions/activity-logs"
import type { ActivityLog } from "@/types"

type Props = {
  logs: ActivityLog[]
  companyId: string
}

export function ActivityTab({ logs, companyId }: Props) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setLoading(true)
    await createActivityLog(companyId, content, "Note")
    setContent("")
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add Note</h3>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter activity note..."
          rows={3}
        />
        <Button onClick={handleSubmit} disabled={loading || !content.trim()} size="sm">
          {loading ? "Saving..." : "Add Note"}
        </Button>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-lg border bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge status={log.type} />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{log.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
