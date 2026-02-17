"use client"

import { useState } from "react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTicket } from "@/actions/tickets"
import type { Ticket } from "@/types"

type Props = {
  tickets: Ticket[]
  companyId: string
}

export function TicketsTab({ tickets, companyId }: Props) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    await createTicket(companyId, title)
    setTitle("")
    setLoading(false)
  }

  const openCount = tickets.filter((t) => t.status === "Open").length
  const blockedCount = tickets.filter((t) => t.status === "Blocked").length

  return (
    <div className="space-y-6">
      {tickets.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            {openCount} open · {blockedCount} blocked ·{" "}
            {tickets.length - openCount - blockedCount} closed
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New ticket title..."
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
          {loading ? "Adding..." : "Add Ticket"}
        </Button>
      </div>

      <div className="space-y-2">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets for this client.</p>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
            >
              <span className="text-sm">{ticket.title}</span>
              <StatusBadge status={ticket.status} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
