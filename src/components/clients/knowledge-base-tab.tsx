"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ExternalLink, FileText, Link2, StickyNote, Trash2 } from "lucide-react"
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
import { createKBEntry, deleteKBEntry } from "@/actions/knowledge-base"
import type { KnowledgeBaseEntry, KBEntryType } from "@/types"

type Props = {
  entries: KnowledgeBaseEntry[]
  companyId: string
}

const typeIcons = {
  Doc: FileText,
  Link: Link2,
  Note: StickyNote,
}

const typeColors: Record<string, string> = {
  Doc: "bg-blue-100 text-blue-700 border-blue-200",
  Link: "bg-green-100 text-green-700 border-green-200",
  Note: "bg-yellow-100 text-yellow-700 border-yellow-200",
}

const defaultForm = {
  title: "",
  type: "Link" as KBEntryType,
  url: "",
  content: "",
}

export function KnowledgeBaseTab({ entries, companyId }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!form.title.trim()) return
    if (form.type !== "Note" && !form.url.trim()) return
    if (form.type === "Note" && !form.content.trim()) return
    setLoading(true)
    await createKBEntry(companyId, {
      title: form.title,
      type: form.type,
      url: form.type !== "Note" ? form.url : undefined,
      content: form.type === "Note" ? form.content : undefined,
    })
    setForm(defaultForm)
    setLoading(false)
  }

  const handleDelete = async (entryId: string) => {
    await deleteKBEntry(entryId, companyId)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold">Add Entry</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Entry name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as KBEntryType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Doc">Doc</SelectItem>
                <SelectItem value="Link">Link</SelectItem>
                <SelectItem value="Note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.type !== "Note" ? (
          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              type="url"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Note Content</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your note here..."
              rows={3}
            />
          </div>
        )}
        <Button onClick={handleCreate} disabled={loading} size="sm">
          {loading ? "Adding..." : "Add Entry"}
        </Button>
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No knowledge base entries yet. Add docs, links, or notes to preserve institutional knowledge.
          </p>
        ) : (
          entries.map((entry) => {
            const Icon = typeIcons[entry.type as KBEntryType] ?? FileText
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-lg border bg-white p-4"
              >
                <div className="mt-0.5 shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.url ? (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {entry.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-medium text-sm">{entry.title}</span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        typeColors[entry.type] ?? "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {entry.type}
                    </span>
                  </div>
                  {entry.content && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {entry.content}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Added {format(new Date(entry.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
