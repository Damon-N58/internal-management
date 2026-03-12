"use client"

import { useState } from "react"
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
  Bot,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  Wrench,
  Radio,
  Globe,
  CalendarClock,
  FileText,
  Terminal,
} from "lucide-react"
import { createAgentConfig, updateAgentConfig, deleteAgentConfig } from "@/actions/agents"
import type { AgentConfig } from "@/types"

type Props = {
  agents: AgentConfig[]
  companyId: string
}

const emptyForm = {
  agent_name: "",
  description: "",
  prompt: "",
  channel: "",
  tool_calls: "",
  external_resources: "",
  weekly_tasks: "",
  notes: "",
  sort_order: 0,
}

type AgentForm = typeof emptyForm

export function AgentsTab({ agents: initialAgents, companyId }: Props) {
  const [agents, setAgents] = useState(initialAgents)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AgentForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (agent: AgentConfig) => {
    setEditingId(agent.id)
    setForm({
      agent_name: agent.agent_name,
      description: agent.description ?? "",
      prompt: agent.prompt ?? "",
      channel: agent.channel ?? "",
      tool_calls: agent.tool_calls ?? "",
      external_resources: agent.external_resources ?? "",
      weekly_tasks: agent.weekly_tasks ?? "",
      notes: agent.notes ?? "",
      sort_order: agent.sort_order,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.agent_name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateAgentConfig(editingId, companyId, {
          agent_name: form.agent_name,
          description: form.description || undefined,
          prompt: form.prompt || undefined,
          channel: form.channel || undefined,
          tool_calls: form.tool_calls || undefined,
          external_resources: form.external_resources || undefined,
          weekly_tasks: form.weekly_tasks || undefined,
          notes: form.notes || undefined,
          sort_order: form.sort_order,
        })
        setAgents((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  agent_name: form.agent_name,
                  description: form.description || null,
                  prompt: form.prompt || null,
                  channel: form.channel || null,
                  tool_calls: form.tool_calls || null,
                  external_resources: form.external_resources || null,
                  weekly_tasks: form.weekly_tasks || null,
                  notes: form.notes || null,
                  sort_order: form.sort_order,
                }
              : a
          )
        )
      } else {
        const created = await createAgentConfig({
          company_id: companyId,
          agent_name: form.agent_name,
          description: form.description || undefined,
          prompt: form.prompt || undefined,
          channel: form.channel || undefined,
          tool_calls: form.tool_calls || undefined,
          external_resources: form.external_resources || undefined,
          weekly_tasks: form.weekly_tasks || undefined,
          notes: form.notes || undefined,
          sort_order: form.sort_order,
        })
        setAgents((prev) => [...prev, created])
        setExpanded((prev) => new Set(prev).add(created.id))
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteAgentConfig(id, companyId)
    setAgents((prev) => prev.filter((a) => a.id !== id))
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">AI Agents</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full documentation for every agent running for this company
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No agents documented yet. Add the first agent to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => {
            const open = expanded.has(agent.id)
            return (
              <div key={agent.id} className="rounded-lg border bg-white">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggle(agent.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-4 w-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-sm font-semibold">{agent.agent_name}</span>
                      {agent.channel && (
                        <span className="ml-2 text-xs text-muted-foreground bg-slate-100 rounded px-1.5 py-0.5">
                          {agent.channel}
                        </span>
                      )}
                      {agent.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(agent) }}
                      className="p-1 text-muted-foreground hover:text-slate-700 rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(agent.id) }}
                      className="p-1 text-muted-foreground hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {open && (
                  <div className="border-t px-4 py-4 space-y-4">
                    {agent.description && (
                      <AgentSection icon={<FileText className="h-3.5 w-3.5" />} label="Description">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{agent.description}</p>
                      </AgentSection>
                    )}

                    {agent.prompt && (
                      <AgentSection icon={<Terminal className="h-3.5 w-3.5" />} label="Prompt Name">
                        <p className="text-sm text-slate-700">{agent.prompt}</p>
                      </AgentSection>
                    )}

                    {agent.channel && (
                      <AgentSection icon={<Radio className="h-3.5 w-3.5" />} label="Channel">
                        <p className="text-sm text-slate-700">{agent.channel}</p>
                      </AgentSection>
                    )}

                    {agent.tool_calls && (
                      <AgentSection icon={<Wrench className="h-3.5 w-3.5" />} label="Tool Calls">
                        <pre className="text-xs bg-slate-50 border rounded p-3 whitespace-pre-wrap font-mono leading-relaxed">
                          {agent.tool_calls}
                        </pre>
                      </AgentSection>
                    )}

                    {agent.external_resources && (
                      <AgentSection icon={<Globe className="h-3.5 w-3.5" />} label="External Resources">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{agent.external_resources}</p>
                      </AgentSection>
                    )}

                    {agent.weekly_tasks && (
                      <AgentSection icon={<CalendarClock className="h-3.5 w-3.5" />} label="Weekly Maintenance">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{agent.weekly_tasks}</p>
                      </AgentSection>
                    )}

                    {agent.notes && (
                      <AgentSection icon={<FileText className="h-3.5 w-3.5" />} label="Notes">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{agent.notes}</p>
                      </AgentSection>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Agent" : "Add Agent"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Agent Name *</Label>
                <Input
                  value={form.agent_name}
                  onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
                  placeholder="e.g. Support Bot, Onboarding Agent"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Input
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  placeholder="e.g. WhatsApp, Email, API, Slack"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this agent do? What problem does it solve?"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Prompt Name</Label>
              <Input
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                placeholder="e.g. Customer Support v2, Onboarding Bot Prompt"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tool Calls</Label>
              <Textarea
                value={form.tool_calls}
                onChange={(e) => setForm({ ...form, tool_calls: e.target.value })}
                placeholder={"List all tool calls the agent makes, e.g.:\n- get_customer_info(customer_id)\n- create_ticket(title, body)\n- send_whatsapp_message(to, body)"}
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>External Resources</Label>
              <Textarea
                value={form.external_resources}
                onChange={(e) => setForm({ ...form, external_resources: e.target.value })}
                placeholder={"List external APIs, webhooks, databases, or services used, e.g.:\n- Zendesk API (tickets)\n- Google Sheets (pricing table)\n- Airtable (product catalog)"}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Weekly Maintenance Tasks</Label>
              <Textarea
                value={form.weekly_tasks}
                onChange={(e) => setForm({ ...form, weekly_tasks: e.target.value })}
                placeholder={"What manual work must be done weekly for this agent?\n- Review failed conversations\n- Update FAQ knowledge base\n- Check webhook error logs"}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional context, quirks, or gotchas..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="w-24"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.agent_name.trim()}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Agent"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Agent?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the agent configuration. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AgentSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-slate-500">{icon}</span>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  )
}
