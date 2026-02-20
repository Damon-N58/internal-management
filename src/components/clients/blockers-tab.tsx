"use client"

import { useState } from "react"
import { format, differenceInDays } from "date-fns"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
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
import { StatusBadge } from "@/components/status-badge"
import { createBlocker, resolveBlocker } from "@/actions/blockers"
import type { Blocker, BlockerCategory } from "@/types"
import { cn } from "@/lib/utils"

type Props = {
  blockers: Blocker[]
  companyId: string
}

const categoryColors: Record<string, string> = {
  Internal: "bg-orange-100 text-orange-700 border-orange-200",
  External: "bg-red-100 text-red-700 border-red-200",
  Technical: "bg-blue-100 text-blue-700 border-blue-200",
  Commercial: "bg-purple-100 text-purple-700 border-purple-200",
}

const defaultForm = {
  title: "",
  description: "",
  category: "Internal" as BlockerCategory,
  owner: "",
  resolutionDeadline: "",
}

export function BlockersTab({ blockers, companyId }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  const openBlockers = blockers.filter((b) => b.status === "Open")
  const resolvedBlockers = blockers.filter((b) => b.status === "Resolved")

  const isStale = (blocker: Blocker) =>
    differenceInDays(new Date(), new Date(blocker.updated_at)) > 5

  const handleCreate = async () => {
    if (!form.title.trim() || !form.owner.trim()) return
    setLoading(true)
    await createBlocker(companyId, {
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      owner: form.owner,
      resolutionDeadline: form.resolutionDeadline
        ? new Date(form.resolutionDeadline)
        : undefined,
    })
    setForm(defaultForm)
    setLoading(false)
  }

  const handleResolve = async (blockerId: string) => {
    await resolveBlocker(blockerId, companyId)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold">Add Blocker</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What's blocking progress?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as BlockerCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Internal">Internal</SelectItem>
                <SelectItem value="External">External</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Who owns resolution?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Resolution Deadline</Label>
            <Input
              type="date"
              value={form.resolutionDeadline}
              onChange={(e) => setForm({ ...form, resolutionDeadline: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional context..."
            rows={2}
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={loading || !form.title.trim() || !form.owner.trim()}
          size="sm"
        >
          {loading ? "Adding..." : "Add Blocker"}
        </Button>
      </div>

      <div className="space-y-2">
        {openBlockers.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            No open blockers — this client is unblocked.
          </div>
        ) : (
          openBlockers.map((blocker) => {
            const stale = isStale(blocker)
            const escalated = blocker.escalation_level > 0
            return (
              <div
                key={blocker.id}
                className={cn(
                  "rounded-lg border bg-white p-4 space-y-2",
                  (stale || escalated) && "border-amber-300 bg-amber-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{blocker.title}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          categoryColors[blocker.category] ??
                            "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {blocker.category}
                      </span>
                      {(stale || escalated) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          {escalated ? "Escalated" : "Stale"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Owner: {blocker.owner}</span>
                      {blocker.resolution_deadline && (
                        <span>
                          Due: {format(new Date(blocker.resolution_deadline), "MMM d, yyyy")}
                        </span>
                      )}
                      <span>
                        Added {format(new Date(blocker.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {blocker.description && (
                      <p className="text-sm text-muted-foreground">{blocker.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(blocker.id)}
                    className="shrink-0"
                  >
                    Mark Resolved
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {resolvedBlockers.length > 0 && (
        <div>
          <button
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {resolvedBlockers.length} resolved blocker{resolvedBlockers.length !== 1 ? "s" : ""}
          </button>
          {showResolved && (
            <div className="mt-2 space-y-2">
              {resolvedBlockers.map((blocker) => (
                <div
                  key={blocker.id}
                  className="rounded-lg border bg-slate-50 px-4 py-3 opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm line-through text-muted-foreground">
                      {blocker.title}
                    </span>
                    <StatusBadge status="Resolved" />
                    {blocker.resolved_at && (
                      <span className="text-xs text-muted-foreground">
                        Resolved {format(new Date(blocker.resolved_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
