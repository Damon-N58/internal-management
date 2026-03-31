"use client"

import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react"
import { format, isPast } from "date-fns"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createDeadline, updateDeadline, deleteDeadline } from "@/actions/deadlines"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Deadline } from "@/types"
import type { MilestoneCategory } from "@/types"

const ITEMS_PER_ROW = 4

const CATEGORIES: Record<MilestoneCategory, { dot: string; ring: string; badge: string; label: string }> = {
  Milestone: { dot: "bg-slate-500", ring: "ring-slate-300", badge: "bg-slate-100 text-slate-700", label: "Milestone" },
  Contract:  { dot: "bg-green-500", ring: "ring-green-300",  badge: "bg-green-100 text-green-700",  label: "Contract"  },
  Delivery:  { dot: "bg-blue-500",  ring: "ring-blue-300",   badge: "bg-blue-100 text-blue-700",    label: "Delivery"  },
  Review:    { dot: "bg-purple-500",ring: "ring-purple-300", badge: "bg-purple-100 text-purple-700",label: "Review"    },
  Risk:      { dot: "bg-red-500",   ring: "ring-red-300",    badge: "bg-red-100 text-red-700",      label: "Risk"      },
}

function categoryOf(c: string | null): MilestoneCategory {
  if (c && c in CATEGORIES) return c as MilestoneCategory
  return "Milestone"
}

type Props = {
  deadlines: Deadline[]
  companyId: string
}

type EditState = {
  description: string
  due_date: string
  category: MilestoneCategory
}

export function PipelineTimeline({ deadlines, companyId }: Props) {
  const router = useRouter()
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add form state
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<EditState>({ description: "", due_date: "", category: "Milestone" })
  const [adding, setAdding] = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<Record<string, HTMLButtonElement>>({})
  const rowDescRefs = useRef<Record<number, HTMLDivElement>>({})
  const rowDateRefs = useRef<Record<number, HTMLDivElement>>({})
  const [svgPaths, setSvgPaths] = useState<string[]>([])

  const sorted = useMemo(
    () => [...deadlines].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    [deadlines]
  )

  const rows = useMemo(() => {
    const r: Deadline[][] = []
    for (let i = 0; i < sorted.length; i += ITEMS_PER_ROW) {
      r.push(sorted.slice(i, i + ITEMS_PER_ROW))
    }
    return r
  }, [sorted])

  // Measure dot + row-boundary positions, route connector around all text
  const recalcConnectors = useCallback(() => {
    if (rows.length <= 1 || !containerRef.current) { setSvgPaths([]); return }
    const cRect = containerRef.current.getBoundingClientRect()
    const containerW = cRect.width
    const paths: string[] = []

    for (let i = 0; i < rows.length - 1; i++) {
      const lastDot = dotRefs.current[rows[i][rows[i].length - 1].id]
      const firstDot = dotRefs.current[rows[i + 1][0].id]
      const descEl = rowDescRefs.current[i]
      const nextDateEl = rowDateRefs.current[i + 1]
      if (!lastDot || !firstDot) continue

      const a = lastDot.getBoundingClientRect()
      const b = firstDot.getBoundingClientRect()

      // Dot centers relative to container
      const x1 = a.left + a.width / 2 - cRect.left
      const y1 = a.top + a.height / 2 - cRect.top
      const x2 = b.left + b.width / 2 - cRect.left
      const y2 = b.top + b.height / 2 - cRect.top

      // Find the clear gap between rows (below descriptions, above next dates)
      const gapTop = descEl ? descEl.getBoundingClientRect().bottom - cRect.top + 4 : y1 + 30
      const gapBottom = nextDateEl ? nextDateEl.getBoundingClientRect().top - cRect.top - 4 : y2 - 30
      const midY = (gapTop + gapBottom) / 2

      // Route: dot1 → right to container edge → down to midY → left to container left edge → down to dot2 Y → right to dot2
      const edgeR = containerW
      const edgeL = 0

      paths.push(
        `M ${x1},${y1} L ${edgeR},${y1} L ${edgeR},${midY} L ${edgeL},${midY} L ${edgeL},${y2} L ${x2},${y2}`
      )
    }
    setSvgPaths(paths)
  }, [rows])

  useEffect(() => {
    recalcConnectors()
    window.addEventListener("resize", recalcConnectors)
    return () => window.removeEventListener("resize", recalcConnectors)
  }, [recalcConnectors])

  // Close popover on outside click
  useEffect(() => {
    if (!openId) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenId(null)
        setEditing(null)
        setDeleteConfirm(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openId])

  const openPopover = (d: Deadline) => {
    if (openId === d.id) { setOpenId(null); setEditing(null); setDeleteConfirm(false); return }
    setOpenId(d.id)
    setEditing(null)
    setDeleteConfirm(false)
  }

  const handleSave = async (id: string) => {
    if (!editing) return
    setSaving(true)
    const result = await updateDeadline(id, companyId, editing)
    setSaving(false)
    if (result.error) { toast.error("Failed to save"); return }
    setOpenId(null)
    setEditing(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    const result = await deleteDeadline(id, companyId)
    setSaving(false)
    if (result.error) { toast.error("Failed to delete"); return }
    setOpenId(null)
    router.refresh()
  }

  const handleAdd = async () => {
    if (!addForm.description.trim() || !addForm.due_date) {
      toast.error("Description and date are required")
      return
    }
    setAdding(true)
    const result = await createDeadline(companyId, addForm)
    setAdding(false)
    if (result.error) { toast.error("Failed to create milestone"); return }
    setShowAdd(false)
    setAddForm({ description: "", due_date: "", category: "Milestone" })
    router.refresh()
  }

  return (
    <div ref={containerRef} className="relative">
      {/* SVG overlay for row-to-row connectors — routed around text */}
      {svgPaths.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
          {svgPaths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          ))}
        </svg>
      )}

      {sorted.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground mb-4">No milestones yet. Add one to start mapping your pipeline.</p>
      )}

      {rows.map((row, rowIdx) => {
        const isLastRow = rowIdx === rows.length - 1

        return (
          <Fragment key={rowIdx}>
            {/* Date labels */}
            <div ref={(el) => { if (el) rowDateRefs.current[rowIdx] = el }} className={cn("flex mb-1", rowIdx > 0 && "mt-6")}>
              {row.map((d) => {
                const past = isPast(new Date(d.due_date))
                return (
                  <div key={d.id} className="flex-1 flex justify-center px-1">
                    <span className={cn("text-[10px] font-medium tabular-nums", past ? "text-muted-foreground" : "text-slate-600")}>
                      {format(new Date(d.due_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Dot row: background line + centered dots */}
            <div className="relative flex items-center">
              {/* Line spans only between first and last dot centers */}
              <div
                className="absolute top-1/2 h-px bg-slate-200 -translate-y-px pointer-events-none"
                style={{
                  left: `${(1 / (2 * row.length)) * 100}%`,
                  right: `${(1 / (2 * row.length)) * 100}%`,
                }}
              />
              {row.map((d, i) => {
                const cat = categoryOf(d.category)
                const cfg = CATEGORIES[cat]
                const past = isPast(new Date(d.due_date))
                const isOpen = openId === d.id
                return (
                  <div key={d.id} className="flex-1 flex justify-center relative">
                    <button
                      ref={(el) => { if (el) dotRefs.current[d.id] = el }}
                      onClick={() => openPopover(d)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 border-white ring-2 transition-all duration-200 shrink-0 relative z-10",
                        past ? "bg-slate-300 ring-slate-200" : cfg.dot,
                        past ? "" : cfg.ring,
                        isOpen && "scale-125"
                      )}
                    />
                    {isOpen && (
                      <div
                        ref={popoverRef}
                        className={cn(
                          "absolute top-8 z-30 w-64 rounded-xl border bg-white shadow-xl p-3 space-y-3",
                          i === 0 ? "left-0" : i === row.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cfg.badge)}>{cat}</span>
                          <button onClick={() => { setOpenId(null); setEditing(null); setDeleteConfirm(false) }} className="text-muted-foreground hover:text-slate-900">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {editing ? (
                          <div className="space-y-2">
                            <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" className="text-xs h-8" autoFocus />
                            <Input type="date" value={editing.due_date} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} className="text-xs h-8" />
                            <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as MilestoneCategory })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.keys(CATEGORIES).map((k) => <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>)}</SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => handleSave(d.id)} disabled={saving}><Check className="h-3 w-3 mr-1" />Save</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="text-sm font-medium leading-snug">{d.description}</p>
                              <p className={cn("text-xs mt-0.5", past ? "text-muted-foreground line-through" : "text-slate-500")}>{format(new Date(d.due_date), "MMMM d, yyyy")}</p>
                              {past && <p className="text-xs text-amber-600 mt-0.5">Past due</p>}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => setEditing({ description: d.description, due_date: d.due_date, category: categoryOf(d.category) })}>
                                <Pencil className="h-3 w-3" />Edit
                              </Button>
                              {deleteConfirm ? (
                                <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={() => handleDelete(d.id)} disabled={saving}>Confirm delete</Button>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirm(true)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Description labels below dots — always shown, not part of connector */}
            <div ref={(el) => { if (el) rowDescRefs.current[rowIdx] = el }} className="flex mt-2 mb-1">
              {row.map((d) => {
                const cat = categoryOf(d.category)
                const cfg = CATEGORIES[cat]
                const past = isPast(new Date(d.due_date))
                return (
                  <div key={d.id} className="flex-1 flex flex-col items-center px-1 gap-0.5">
                    <span className={cn("text-[11px] font-medium text-center leading-tight max-w-[90px]", past ? "text-muted-foreground line-through" : "text-slate-700")}>
                      {d.description}
                    </span>
                    <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", cfg.badge)}>{cat}</span>
                  </div>
                )
              })}
            </div>

          </Fragment>
        )
      })}

      {/* Add milestone form */}
      {showAdd ? (
        <div className="rounded-lg border border-dashed bg-slate-50 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">New milestone</p>
          <Input
            value={addForm.description}
            onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
            placeholder="e.g. Contract renewal"
            className="text-sm h-8"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={addForm.due_date}
              onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })}
              className="text-sm h-8"
            />
            <Select
              value={addForm.category}
              onValueChange={(v) => setAddForm({ ...addForm, category: v as MilestoneCategory })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORIES).map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={adding} className="h-8">
              {adding ? "Adding..." : "Add milestone"}
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => { setShowAdd(false); setAddForm({ description: "", due_date: "", category: "Milestone" }) }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-slate-900 transition-colors group"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 group-hover:border-slate-500 transition-colors">
            <Plus className="h-3 w-3" />
          </span>
          Add milestone
        </button>
      )}
    </div>
  )
}
