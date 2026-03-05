"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Plus, CheckCircle2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PCRModal } from "./pcr-modal"
import { updatePCRStatus } from "@/actions/pcr"
import { useRouter } from "next/navigation"
import type { ProductChangeRequest, PCRStatus } from "@/types"

type ProfileOption = { id: string; full_name: string; email: string }
type Props = { pcrs: ProductChangeRequest[]; profiles: ProfileOption[] }

const statusFilters: ("All" | PCRStatus)[] = ["All", "Requested", "In Progress", "Completed"]

const priorityLabel: Record<number, string> = {
  1: "🔴 Critical",
  2: "🟠 High",
  3: "🟡 Medium",
  4: "🟢 Low",
  5: "⚪ Minimal",
}

export function ProductTable({ pcrs, profiles }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<"All" | PCRStatus>("All")
  const [modalOpen, setModalOpen] = useState(false)

  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completedBy, setCompletedBy] = useState("")
  const [saving, setSaving] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, { status: string; completed_by?: string }>>({})

  const effectivePcrs = pcrs.map((p) => {
    const ov = overrides[p.id]
    if (!ov) return p
    return { ...p, status: ov.status as PCRStatus, completed_by: ov.completed_by ?? p.completed_by }
  })

  const filtered = filter === "All" ? effectivePcrs : effectivePcrs.filter((p) => p.status === filter)

  const handleStatusChange = async (pcrId: string, newStatus: string) => {
    if (newStatus === "Completed") {
      setOverrides((prev) => ({ ...prev, [pcrId]: { status: "Completed" } }))
      setCompletingId(pcrId)
      setCompletedBy("")
      return
    }
    setOverrides((prev) => ({ ...prev, [pcrId]: { status: newStatus } }))
    const result = await updatePCRStatus(pcrId, newStatus)
    if (result.error) {
      console.error("PCR status update failed:", result.error)
      setOverrides((prev) => { const n = { ...prev }; delete n[pcrId]; return n })
      alert(`Failed to update status: ${result.error}`)
      return
    }
    router.refresh()
  }

  const handleConfirmComplete = async () => {
    if (!completingId || !completedBy) return
    setSaving(true)
    setOverrides((prev) => ({ ...prev, [completingId]: { status: "Completed", completed_by: completedBy } }))
    const result = await updatePCRStatus(completingId, "Completed", completedBy)
    setSaving(false)
    if (result.error) {
      console.error("PCR complete failed:", result.error)
      setOverrides((prev) => { const n = { ...prev }; delete n[completingId]; return n })
      alert(`Failed to save: ${result.error}`)
      return
    }
    setCompletingId(null)
    setCompletedBy("")
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as "All" | PCRStatus)}
          >
            <TabsList>
              {statusFilters.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {s}
                  {s !== "All" && (
                    <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
                      {effectivePcrs.filter((p) => p.status === s).length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Feature / Issue
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((pcr) => (
                  <TableRow key={pcr.id}>
                    <TableCell>
                      <StatusBadge status={pcr.issue} />
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <span className="text-sm">{pcr.description}</span>
                    </TableCell>
                    <TableCell className="text-sm">{pcr.location}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {priorityLabel[pcr.priority] ?? pcr.priority}
                    </TableCell>
                    <TableCell className="text-sm">{pcr.requested_by}</TableCell>
                    <TableCell className="text-sm">
                      {pcr.assigned_to ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={pcr.status}
                        onValueChange={(val) => handleStatusChange(pcr.id, val)}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Requested">Requested</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      {pcr.status === "Completed" && pcr.completed_by && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          <span className="text-[11px] text-muted-foreground">
                            {pcr.completed_by}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pcr.deadline ? format(new Date(pcr.deadline), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <PCRModal open={modalOpen} onClose={() => setModalOpen(false)} profiles={profiles} />
      </Card>

      <Dialog open={!!completingId} onOpenChange={() => {
        if (completingId) {
          setOverrides((prev) => {
            const next = { ...prev }
            delete next[completingId]
            return next
          })
        }
        setCompletingId(null)
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Who completed this?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Select value={completedBy} onValueChange={setCompletedBy}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.full_name || p.email}>
                    {p.full_name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                if (completingId) {
                  setOverrides((prev) => {
                    const next = { ...prev }
                    delete next[completingId]
                    return next
                  })
                }
                setCompletingId(null)
              }}>
                Cancel
              </Button>
              <Button disabled={!completedBy || saving} onClick={handleConfirmComplete}>
                {saving ? "Saving..." : "Mark Completed"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
