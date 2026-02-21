"use client"

import { useState } from "react"
import { format } from "date-fns"
import { MessageSquare, User } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateTicketStatus, addTicketComment } from "@/actions/tickets"
import type { Ticket, TicketStatus } from "@/types"
import { cn } from "@/lib/utils"

type TicketWithCompany = Ticket & { company_name: string }
type TeamMember = { id: string; full_name: string; email: string }

type Props = {
  tickets: TicketWithCompany[]
  teamMembers: TeamMember[]
}

const priorityLabel: Record<number, string> = {
  1: "🔴 Critical",
  2: "🟠 High",
  3: "🟡 Medium",
  4: "🟢 Low",
  5: "⚪ Minimal",
}

const statusFilters: ("All" | TicketStatus)[] = ["All", "Open", "In Progress", "Blocked", "Closed"]

export function TicketsPageView({ tickets, teamMembers }: Props) {
  const [filter, setFilter] = useState<"All" | TicketStatus>("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)

  const filtered = filter === "All" ? tickets : tickets.filter((t) => t.status === filter)

  const counts = {
    Open: tickets.filter((t) => t.status === "Open").length,
    "In Progress": tickets.filter((t) => t.status === "In Progress").length,
    Blocked: tickets.filter((t) => t.status === "Blocked").length,
    Closed: tickets.filter((t) => t.status === "Closed").length,
  }

  const assigneeName = (userId: string | null) => {
    if (!userId) return null
    const member = teamMembers.find((m) => m.id === userId)
    return member?.full_name || member?.email || "Unknown"
  }

  const handleStatusChange = async (ticketId: string, companyId: string, status: string) => {
    await updateTicketStatus(ticketId, companyId, status)
  }

  const handleAddComment = async (ticketId: string, companyId: string) => {
    if (!comment.trim()) return
    setCommentLoading(true)
    await addTicketComment(ticketId, companyId, comment)
    setComment("")
    setCommentLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {statusFilters.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
            className="text-xs"
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 rounded-full bg-slate-200 text-slate-700 px-1.5 py-0.5 text-xs">
                {counts[s]}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
            No tickets found.
          </div>
        ) : (
          filtered.map((ticket) => {
            const isExpanded = expandedId === ticket.id
            return (
              <div key={ticket.id} className="rounded-lg border bg-white overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{ticket.title}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
                      {ticket.company_name}
                    </span>
                    <span className="text-xs font-medium shrink-0">
                      {priorityLabel[ticket.priority] ?? ticket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {ticket.assigned_to && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {assigneeName(ticket.assigned_to)}
                      </span>
                    )}
                    {ticket.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due {format(new Date(ticket.due_date), "MMM d")}
                      </span>
                    )}
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4">
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {(["Open", "In Progress", "Blocked", "Closed"] as TicketStatus[]).map((s) => (
                        <Button
                          key={s}
                          variant={ticket.status === s ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(ticket.id, ticket.company_id, s)
                          }}
                          className="text-xs"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="font-medium">Comments</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment or update..."
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation()
                              handleAddComment(ticket.id, ticket.company_id)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          disabled={commentLoading || !comment.trim()}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddComment(ticket.id, ticket.company_id)
                          }}
                        >
                          Post
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
