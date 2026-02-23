"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Plus, User, MessageSquare, Calendar, GripVertical, Clock, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createTicket, updateTicketStatus, addTicketComment } from "@/actions/tickets"
import { useRouter } from "next/navigation"
import type { Ticket, TicketStatus } from "@/types"

type TicketWithCompany = Ticket & { company_name: string }
type TeamMember = { id: string; full_name: string; email: string }
type CompanyOption = { id: string; name: string }

type Props = {
  tickets: TicketWithCompany[]
  teamMembers: TeamMember[]
  companies: CompanyOption[]
}

const columns: { status: TicketStatus; label: string; color: string; bgColor: string }[] = [
  { status: "Open", label: "Open", color: "border-blue-400", bgColor: "bg-blue-50" },
  { status: "In Progress", label: "In Progress", color: "border-amber-400", bgColor: "bg-amber-50" },
  { status: "Blocked", label: "Blocked", color: "border-red-400", bgColor: "bg-red-50" },
  { status: "Closed", label: "Closed", color: "border-green-400", bgColor: "bg-green-50" },
]

const priorityLabel: Record<number, { text: string; dot: string }> = {
  1: { text: "Critical", dot: "bg-red-500" },
  2: { text: "High", dot: "bg-orange-500" },
  3: { text: "Medium", dot: "bg-yellow-500" },
  4: { text: "Low", dot: "bg-green-500" },
  5: { text: "Minimal", dot: "bg-slate-400" },
}

export function TicketsKanban({ tickets, teamMembers, companies }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [detailTicket, setDetailTicket] = useState<TicketWithCompany | null>(null)
  const [comment, setComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [dragTicketId, setDragTicketId] = useState<string | null>(null)

  // Close dialog state
  const [closeDialogTicket, setCloseDialogTicket] = useState<TicketWithCompany | null>(null)
  const [actualHours, setActualHours] = useState("")

  // Create form state
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newCompany, setNewCompany] = useState("")
  const [newPriority, setNewPriority] = useState("3")
  const [newAssignee, setNewAssignee] = useState("")
  const [newDueDate, setNewDueDate] = useState("")
  const [newEstimatedHours, setNewEstimatedHours] = useState("")
  const [creating, setCreating] = useState(false)

  const assigneeName = (userId: string | null) => {
    if (!userId) return null
    const member = teamMembers.find((m) => m.id === userId)
    return member?.full_name || member?.email || null
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newCompany) return
    setCreating(true)
    await createTicket(newCompany, {
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: parseInt(newPriority),
      assigned_to: newAssignee || null,
      due_date: newDueDate || null,
      estimated_hours: newEstimatedHours ? parseFloat(newEstimatedHours) : null,
    })
    setCreateOpen(false)
    setNewTitle("")
    setNewDescription("")
    setNewCompany("")
    setNewPriority("3")
    setNewAssignee("")
    setNewDueDate("")
    setNewEstimatedHours("")
    setCreating(false)
    router.refresh()
  }

  const promptCloseTicket = (ticket: TicketWithCompany) => {
    setCloseDialogTicket(ticket)
    setActualHours("")
  }

  const handleConfirmClose = async () => {
    if (!closeDialogTicket) return
    const hours = actualHours ? parseFloat(actualHours) : undefined
    await updateTicketStatus(closeDialogTicket.id, closeDialogTicket.company_id, "Closed", hours)
    setCloseDialogTicket(null)
    setDetailTicket(null)
    router.refresh()
  }

  const handleStatusChange = async (ticket: TicketWithCompany, status: string) => {
    if (status === "Closed") {
      promptCloseTicket(ticket)
      return
    }
    await updateTicketStatus(ticket.id, ticket.company_id, status)
    setDetailTicket(null)
    router.refresh()
  }

  const handleDrop = async (status: TicketStatus) => {
    if (!dragTicketId) return
    const ticket = tickets.find((t) => t.id === dragTicketId)
    if (!ticket || ticket.status === status) {
      setDragTicketId(null)
      return
    }
    setDragTicketId(null)
    if (status === "Closed") {
      promptCloseTicket(ticket)
      return
    }
    await updateTicketStatus(ticket.id, ticket.company_id, status)
    router.refresh()
  }

  const handleAddComment = async (ticketId: string, companyId: string) => {
    if (!comment.trim()) return
    setCommentLoading(true)
    await addTicketComment(ticketId, companyId, comment)
    setComment("")
    setCommentLoading(false)
    router.refresh()
  }

  const companiesWithGeneral: CompanyOption[] = [
    { id: "_general", name: "General (Internal)" },
    ...companies.filter((c) => c.id !== "_general"),
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{tickets.length} total ticket{tickets.length !== 1 ? "s" : ""}</span>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Ticket
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 min-h-[calc(100vh-16rem)]">
        {columns.map(({ status, label, color, bgColor }) => {
          const columnTickets = tickets.filter((t) => t.status === status)
          return (
            <div
              key={status}
              className={cn("rounded-lg border-t-2 bg-slate-50/50 p-3 flex flex-col", color)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", bgColor)}>
                    {columnTickets.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {columnTickets.map((ticket) => {
                  const priority = priorityLabel[ticket.priority] ?? priorityLabel[3]
                  const assignee = assigneeName(ticket.assigned_to)
                  return (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={() => setDragTicketId(ticket.id)}
                      onDragEnd={() => setDragTicketId(null)}
                      onClick={() => setDetailTicket(ticket)}
                      className={cn(
                        "rounded-lg border bg-white p-3 cursor-pointer hover:shadow-sm transition-shadow group",
                        dragTicketId === ticket.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-slate-300 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ticket.company_name}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-xs">
                              <span className={cn("h-2 w-2 rounded-full", priority.dot)} />
                              {priority.text}
                            </span>
                            {assignee && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {assignee}
                              </span>
                            )}
                            {ticket.due_date && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(ticket.due_date), "MMM d")}
                              </span>
                            )}
                            {ticket.estimated_hours != null && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {ticket.estimated_hours}h est
                              </span>
                            )}
                            {ticket.actual_hours != null && (
                              <span className={cn(
                                "flex items-center gap-1 text-xs font-medium",
                                ticket.estimated_hours && ticket.actual_hours > ticket.estimated_hours
                                  ? "text-red-600" : "text-green-600"
                              )}>
                                <Timer className="h-3 w-3" />
                                {ticket.actual_hours}h actual
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {columnTickets.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border border-dashed rounded-lg">
                    No tickets
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={newCompany} onValueChange={setNewCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesWithGeneral.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🔴 Critical</SelectItem>
                    <SelectItem value="2">🟠 High</SelectItem>
                    <SelectItem value="3">🟡 Medium</SelectItem>
                    <SelectItem value="4">🟢 Low</SelectItem>
                    <SelectItem value="5">⚪ Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
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
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Est. Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={newEstimatedHours}
                  onChange={(e) => setNewEstimatedHours(e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim() || !newCompany}
              >
                {creating ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Ticket Dialog — prompt for actual hours */}
      <Dialog open={!!closeDialogTicket} onOpenChange={(open) => !open && setCloseDialogTicket(null)}>
        {closeDialogTicket && (
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Close Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                How long did <span className="font-medium text-foreground">&ldquo;{closeDialogTicket.title}&rdquo;</span> actually take?
              </p>
              {closeDialogTicket.estimated_hours != null && (
                <p className="text-xs text-muted-foreground">
                  Estimated: {closeDialogTicket.estimated_hours} hours
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Actual Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  placeholder="e.g. 3.5"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCloseDialogTicket(null)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmClose}>
                  Close Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!detailTicket} onOpenChange={(open) => !open && setDetailTicket(null)}>
        {detailTicket && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{detailTicket.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {detailTicket.company_name}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <span className={cn("h-2 w-2 rounded-full", (priorityLabel[detailTicket.priority] ?? priorityLabel[3]).dot)} />
                  {(priorityLabel[detailTicket.priority] ?? priorityLabel[3]).text}
                </span>
                {assigneeName(detailTicket.assigned_to) && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {assigneeName(detailTicket.assigned_to)}
                  </span>
                )}
                {detailTicket.due_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Due {format(new Date(detailTicket.due_date), "MMM d, yyyy")}
                  </span>
                )}
              </div>

              {(detailTicket.estimated_hours != null || detailTicket.actual_hours != null) && (
                <div className="flex items-center gap-4 text-sm">
                  {detailTicket.estimated_hours != null && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Est: {detailTicket.estimated_hours}h
                    </span>
                  )}
                  {detailTicket.actual_hours != null && (
                    <span className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      detailTicket.estimated_hours && detailTicket.actual_hours > detailTicket.estimated_hours
                        ? "text-red-600" : "text-green-600"
                    )}>
                      <Timer className="h-3.5 w-3.5" />
                      Actual: {detailTicket.actual_hours}h
                    </span>
                  )}
                </div>
              )}

              {detailTicket.description && (
                <p className="text-sm text-muted-foreground">{detailTicket.description}</p>
              )}

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {columns.map(({ status, label }) => (
                    <Button
                      key={status}
                      variant={detailTicket.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(detailTicket, status)}
                      className="text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
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
                    placeholder="Add a comment..."
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment(detailTicket.id, detailTicket.company_id)
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={commentLoading || !comment.trim()}
                    onClick={() => handleAddComment(detailTicket.id, detailTicket.company_id)}
                  >
                    Post
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created {format(new Date(detailTicket.created_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
