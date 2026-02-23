"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { createPCR } from "@/actions/pcr"
import { toast } from "sonner"
import type { PCRIssueType, PCRLocation } from "@/types"

type Props = {
  open: boolean
  onClose: () => void
}

const defaultForm = {
  issue: "Feature" as PCRIssueType,
  description: "",
  location: "UI" as PCRLocation,
  priority: 3,
  requestedBy: "",
  assignedTo: "",
}

export function PCRModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.requestedBy.trim()) return
    setLoading(true)
    const result = await createPCR({
      ...form,
      assignedTo: form.assignedTo.trim() || undefined,
    })
    setLoading(false)
    if (result.error) {
      toast.error("Failed to submit request", { description: result.error })
      return
    }
    setForm(defaultForm)
    onClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Feature Request / Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.issue}
                onValueChange={(v) => setForm({ ...form, issue: v as PCRIssueType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Issue">Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select
                value={form.location}
                onValueChange={(v) => setForm({ ...form, location: v as PCRLocation })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UI">UI</SelectItem>
                  <SelectItem value="Functionality">Functionality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the feature or issue..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priority (1 = Critical, 5 = Minimal)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Math.min(5, Math.max(1, Number(e.target.value))) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Requested By</Label>
              <Input
                value={form.requestedBy}
                onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                placeholder="Name or team"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned To (optional)</Label>
            <Input
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              placeholder="Internal assignee"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.description.trim() || !form.requestedBy.trim()}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
