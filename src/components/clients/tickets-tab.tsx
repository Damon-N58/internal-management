"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, MessageSquare, User } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTicket, updateTicketStatus, addTicketComment } from "@/actions/tickets"
import type { Ticket, TicketStatus } from "@/types"
import type { TeamMember } from "./client-detail-tabs"
import { cn } from "@/lib/utils"

type Props = {
  tickets: Ticket[]
  companyId: string
  teamMembers: TeamMember[]
}

const priorityLabel: Record<number, string> = {
  1: "🔴 Critical",
  2: "🟠 High",
  3: "🟡 Medium",
  4: "🟢 Low",
  5: "⚪ Minimal",
}

const statusFlow: TicketStatus[] = ["Open", "In Progress", "Blocked", "Closed"]

const defaultForm = {
  title: "",
  description: "",
  priority: 3,
  assigned_to: "",
  due_date: "",
}

export function TicketsTab({ tickets, companyId, teamMembers }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)

  const openCount = tickets.filter((t) => t.status === "Open").length
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length
  const blockedCount = tickets.filter((t) => t.status === "Blocked").length

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    await createTicket(companyId, {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
    })
    setForm(defaultForm)
    setLoading(false)
  }

  const handleStatusChange = async (ticketId: string, status: string) => {
    await updateTicketStatus(ticketId, companyId, status)
  }

  const handleAddComment = async (ticketId: string) => {
    if (!comment.trim()) return
    setCommentLoading(true)
    await addTicketComment(ticketId, companyId, comment)
    setComment("")
    setCommentLoading(false)
  }

  const assigneeName = (userId: string | null) => {
    if (!userId) return null
    const member = teamMembers.find((m) => m.id === userId)
    return member?.full_name || member?.email || "Unknown"
  }

  return (
    <div className="space-y-6">
      {tickets.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            {openCount} open · {inProgressCount} in progress · {blockedCount} blocked ·{" "}
            {tickets.length - openCount - inProgressCount - blockedCount} closed
          </span>
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold">Create Ticket</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ticket title..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={String(form.priority)}
              onValueChange={(v) => setForm({ ...form, priority: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {priorityLabel[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <Select
              value={form.assigned_to}
              onValueChange={(v) => setForm({ ...form, assigned_to: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the task..."
            rows={2}
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={loading || !form.title.trim()}
          size="sm"
        >
          {loading ? "Creating..." : "Create Ticket"}
        </Button>
      </div>

      <div className="space-y-2">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets for this client.</p>
        ) : (
          tickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id
            return (
              <div key={ticket.id} className="rounded-lg border bg-white overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium truncate">{ticket.title}</span>
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
                      {statusFlow.map((s) => (
                        <Button
                          key={s}
                          variant={ticket.status === s ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(ticket.id, s)
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
                              handleAddComment(ticket.id)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          disabled={commentLoading || !comment.trim()}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddComment(ticket.id)
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
