"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, MessageSquare, User, Pencil, Trash2, X, Users } from "lucide-react"
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
import {
  createTicket,
  updateTicket,
  updateTicketStatus,
  addTicketComment,
  deleteTicket,
  addTicketMember,
  removeTicketMember,
} from "@/actions/tickets"
import type { Ticket, TicketStatus } from "@/types"
import type { TeamMember } from "./client-detail-tabs"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Props = {
  tickets: Ticket[]
  companyId: string
  teamMembers: TeamMember[]
}

type MemberData = { user_id: string; full_name: string | null; email: string }

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
  const router = useRouter()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriority, setEditPriority] = useState(3)
  const [editAssignee, setEditAssignee] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Members state
  const [members, setMembers] = useState<MemberData[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberToAdd, setMemberToAdd] = useState("")
  const [memberAddLoading, setMemberAddLoading] = useState(false)

  useEffect(() => {
    if (!expandedId) { setMembers([]); return }
    setMembersLoading(true)
    fetch(`/api/tickets/${expandedId}/members`)
      .then((r) => r.json())
      .then((data) => setMembers(data))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false))
  }, [expandedId])

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

  const handleOpenEdit = (ticket: Ticket) => {
    setEditTitle(ticket.title)
    setEditDescription(ticket.description || "")
    setEditPriority(ticket.priority)
    setEditAssignee(ticket.assigned_to || "")
    setEditDueDate(ticket.due_date ? ticket.due_date.split("T")[0] : "")
    setEditingId(ticket.id)
  }

  const handleEditSave = async (ticket: Ticket) => {
    if (!editTitle.trim()) return
    setEditLoading(true)
    const result = await updateTicket(ticket.id, companyId, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      priority: editPriority,
      assigned_to: editAssignee || null,
      due_date: editDueDate || null,
    })
    setEditLoading(false)
    if (result.error) { toast.error("Failed to update ticket", { description: result.error }); return }
    setEditingId(null)
    router.refresh()
  }

  const handleDelete = async (ticketId: string) => {
    setDeleteLoading(true)
    const result = await deleteTicket(ticketId, companyId)
    setDeleteLoading(false)
    if (result.error) { toast.error("Failed to delete ticket", { description: result.error }); return }
    setDeleteConfirmId(null)
    setExpandedId(null)
    router.refresh()
  }

  const handleAddMember = async (ticketId: string) => {
    if (!memberToAdd) return
    setMemberAddLoading(true)
    const result = await addTicketMember(ticketId, memberToAdd)
    setMemberAddLoading(false)
    if (result.error) { toast.error("Failed to add member", { description: result.error }); return }
    setMemberToAdd("")
    fetch(`/api/tickets/${ticketId}/members`)
      .then((r) => r.json())
      .then((data) => setMembers(data))
      .catch(() => {})
  }

  const handleRemoveMember = async (ticketId: string, userId: string) => {
    const result = await removeTicketMember(ticketId, userId)
    if (result.error) { toast.error("Failed to remove member", { description: result.error }); return }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId))
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
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((p) => (
                  <SelectItem key={p} value={String(p)}>{priorityLabel[p]}</SelectItem>
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
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
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
        <Button onClick={handleCreate} disabled={loading || !form.title.trim()} size="sm">
          {loading ? "Creating..." : "Create Ticket"}
        </Button>
      </div>

      <div className="space-y-2">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets for this client.</p>
        ) : (
          tickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id
            const isEditing = editingId === ticket.id
            const isDeleteConfirm = deleteConfirmId === ticket.id
            const availableToAdd = teamMembers.filter((m) => !members.some((mem) => mem.user_id === m.id))

            return (
              <div key={ticket.id} className="rounded-lg border bg-white overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : ticket.id)
                    if (isExpanded) { setEditingId(null); setDeleteConfirmId(null) }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium truncate">{ticket.title}</span>
                    <span className="text-xs font-medium shrink-0">{priorityLabel[ticket.priority] ?? ticket.priority}</span>
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
                    {/* Edit / Delete buttons */}
                    {!isEditing && !isDeleteConfirm && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(ticket) }}
                          className="h-7 px-2.5 text-xs gap-1.5"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(ticket.id) }}
                          className="h-7 px-2.5 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    )}

                    {/* Delete confirmation */}
                    {isDeleteConfirm && (
                      <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 flex items-center justify-between gap-3">
                        <span className="text-sm text-red-700">Delete this ticket permanently?</span>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null) }}
                            disabled={deleteLoading}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id) }}
                            disabled={deleteLoading}
                            className="h-7 text-xs"
                          >
                            {deleteLoading ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditing && (
                      <div className="space-y-3 rounded-md border p-3 bg-slate-50">
                        <div className="space-y-1.5">
                          <Label>Title</Label>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Priority</Label>
                            <Select value={String(editPriority)} onValueChange={(v) => setEditPriority(Number(v))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((p) => (
                                  <SelectItem key={p} value={String(p)}>{priorityLabel[p]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Assigned To</Label>
                            <Select value={editAssignee} onValueChange={setEditAssignee}>
                              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Unassigned</SelectItem>
                                {teamMembers.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Due Date</Label>
                            <Input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Description</Label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                            disabled={editLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleEditSave(ticket) }}
                            disabled={editLoading || !editTitle.trim()}
                          >
                            {editLoading ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Description (view mode) */}
                    {!isEditing && ticket.description && (
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    )}

                    {/* Status buttons */}
                    {!isEditing && (
                      <div className="flex flex-wrap gap-2">
                        {statusFlow.map((s) => (
                          <Button
                            key={s}
                            variant={ticket.status === s ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, s) }}
                            className="text-xs"
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* People / Members */}
                    <div className={cn("space-y-2", !isEditing && "border-t pt-3")}>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium">People ({members.length})</span>
                      </div>
                      {membersLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 items-center">
                          {members.map((m) => (
                            <span
                              key={m.user_id}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs"
                            >
                              {m.full_name || m.email}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveMember(ticket.id, m.user_id) }}
                                className="ml-0.5 hover:text-red-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {availableToAdd.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Select value={memberToAdd} onValueChange={setMemberToAdd}>
                                <SelectTrigger className="h-7 text-xs px-2.5 rounded-full border-dashed min-w-[120px]">
                                  <SelectValue placeholder="+ Add person" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableToAdd.map((m) => (
                                    <SelectItem key={m.id} value={m.id} className="text-xs">
                                      {m.full_name || m.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {memberToAdd && (
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleAddMember(ticket.id) }}
                                  disabled={memberAddLoading}
                                  className="h-7 px-2.5 text-xs rounded-full"
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comments */}
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
                            if (e.key === "Enter") { e.stopPropagation(); handleAddComment(ticket.id) }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          disabled={commentLoading || !comment.trim()}
                          onClick={(e) => { e.stopPropagation(); handleAddComment(ticket.id) }}
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
