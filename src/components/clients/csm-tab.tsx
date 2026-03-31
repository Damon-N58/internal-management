"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Users,
  Bot,
  ShieldAlert,
  Ticket,
  CalendarClock,
  MessageSquare,
  Pencil,
  DollarSign,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { updatePipelineStage, updateContractValue, updateCsmComms } from "@/actions/companies"
import { createActivityLog } from "@/actions/activity-logs"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type {
  Company,
  TechnicalVault,
  ActivityLog,
  Ticket as TicketType,
  Deadline,
  Blocker,
  AgentConfig,
  ActivityLogType,
} from "@/types"
import { PipelineTimeline } from "@/components/clients/pipeline-timeline"

type FullCompany = Company & {
  technical_vault: TechnicalVault | null
  ticket: TicketType[]
  activity_log: ActivityLog[]
  deadline: Deadline[]
  blocker: Blocker[]
  agent_config: AgentConfig[]
}

type Props = {
  company: FullCompany
}

const PIPELINE_STAGES = ["Signed", "Onboarding", "POC Live", "Full Contract", "Expansion Work"] as const
const BALL_OPTIONS = ["Us", "Client", "Engineering", "Waiting"] as const

const stageColors: Record<string, string> = {
  Signed: "bg-slate-100 text-slate-700 border-slate-300",
  Onboarding: "bg-blue-100 text-blue-700 border-blue-300",
  "POC Live": "bg-amber-100 text-amber-700 border-amber-300",
  "Full Contract": "bg-green-100 text-green-700 border-green-300",
  "Expansion Work": "bg-purple-100 text-purple-700 border-purple-300",
}

const ballColors: Record<string, string> = {
  Us: "bg-blue-100 text-blue-700",
  Client: "bg-orange-100 text-orange-700",
  Engineering: "bg-purple-100 text-purple-700",
  Waiting: "bg-slate-100 text-slate-600",
}

function formatUsd(value: number | null) {
  if (value == null) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}

function BlockLabel({ label, className }: { label: string; className?: string }) {
  return (
    <h3 className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", className)}>
      {label}
    </h3>
  )
}

export function CsmTab({ company }: Props) {
  const router = useRouter()

  // Pipeline stage
  const [stageLoading, setStageLoading] = useState(false)

  // Contract value
  const [editingValue, setEditingValue] = useState(false)
  const [contractValueInput, setContractValueInput] = useState(
    company.contract_value != null ? String(company.contract_value) : ""
  )
  const [valueLoading, setValueLoading] = useState(false)

  // Next action
  const [editingAction, setEditingAction] = useState(false)
  const [nextActionInput, setNextActionInput] = useState(company.next_action ?? "")
  const [actionLoading, setActionLoading] = useState(false)

  // Ball in court
  const [ballLoading, setBallLoading] = useState(false)

  // Touchpoint logging
  const [showTouchpoint, setShowTouchpoint] = useState(false)
  const [touchpointContent, setTouchpointContent] = useState("")
  const [touchpointType, setTouchpointType] = useState<ActivityLogType>("Call")
  const [touchpointLoading, setTouchpointLoading] = useState(false)

  const openBlockers = company.blocker.filter((b) => b.status === "Open")
  const openTickets = company.ticket.filter((t) => t.status !== "Closed")
  const lastActivity = [...company.activity_log]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  const handleStageChange = async (stage: string) => {
    setStageLoading(true)
    const result = await updatePipelineStage(company.id, stage === "none" ? null : stage)
    setStageLoading(false)
    if (result.error) { toast.error("Failed to update stage"); return }
    router.refresh()
  }

  const handleValueSave = async () => {
    const parsed = contractValueInput ? parseFloat(contractValueInput) : null
    if (contractValueInput && isNaN(parsed!)) { toast.error("Invalid value"); return }
    setValueLoading(true)
    const result = await updateContractValue(company.id, parsed)
    setValueLoading(false)
    if (result.error) { toast.error("Failed to update contract value"); return }
    setEditingValue(false)
    router.refresh()
  }

  const handleActionSave = async () => {
    setActionLoading(true)
    const result = await updateCsmComms(company.id, { next_action: nextActionInput.trim() || null })
    setActionLoading(false)
    if (result.error) { toast.error("Failed to save"); return }
    setEditingAction(false)
    router.refresh()
  }

  const handleBallChange = async (ball: string) => {
    setBallLoading(true)
    const result = await updateCsmComms(company.id, { ball_in_court: ball === "none" ? null : ball })
    setBallLoading(false)
    if (result.error) { toast.error("Failed to update"); return }
    router.refresh()
  }

  const handleTouchpointLog = async () => {
    if (!touchpointContent.trim()) { toast.error("Please enter a note"); return }
    setTouchpointLoading(true)
    await createActivityLog(company.id, touchpointContent.trim(), touchpointType)
    setTouchpointLoading(false)
    setTouchpointContent("")
    setTouchpointType("Call")
    setShowTouchpoint(false)
    router.refresh()
  }

  const staff = [
    { role: "Primary CSM", name: company.primary_csm },
    { role: "Lead Engineer", name: company.implementation_lead },
    ...(company.second_lead ? [{ role: "2nd Engineer", name: company.second_lead }] : []),
    ...(company.third_lead ? [{ role: "3rd Engineer", name: company.third_lead }] : []),
  ].filter((s) => s.name)

  return (
    <div className="space-y-6">
      {/* Pipeline Stage + Contract Value row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <BlockLabel label="Pipeline Stage" />
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage}
                disabled={stageLoading}
                onClick={() => handleStageChange(company.pipeline_stage === stage ? "none" : stage)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  company.pipeline_stage === stage
                    ? stageColors[stage]
                    : "border-slate-200 text-slate-500 hover:border-slate-400"
                )}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <BlockLabel label="Total Contract Value (USD)" />
          {editingValue ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={contractValueInput}
                  onChange={(e) => setContractValueInput(e.target.value)}
                  placeholder="e.g. 50000"
                  className="pl-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleValueSave() }}
                />
              </div>
              <Button size="sm" onClick={handleValueSave} disabled={valueLoading}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => { setEditingValue(false); setContractValueInput(company.contract_value != null ? String(company.contract_value) : "") }}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-800">
                {formatUsd(company.contract_value)}
              </span>
              <button onClick={() => setEditingValue(true)} className="text-muted-foreground hover:text-slate-900">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Block A: Team & Live Operations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <BlockLabel label="Team" className="mb-0" />
          </div>
          <div className="space-y-2">
            {staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team assigned.</p>
            ) : (
              staff.map((s) => (
                <div key={s.role} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.role}</span>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <BlockLabel label="Live AI Agents" className="mb-0" />
          </div>
          {company.agent_config.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents deployed.</p>
          ) : (
            <div className="space-y-1.5">
              {company.agent_config.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{agent.agent_name}</span>
                  {agent.channel && (
                    <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                      {agent.channel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Block B: Implementation & Blockers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <BlockLabel label="Active Blockers" className="mb-0" />
          </div>
          {openBlockers.length === 0 ? (
            <p className="text-sm text-green-600 font-medium">✓ No active blockers</p>
          ) : (
            <div className="space-y-2">
              {openBlockers.map((b) => (
                <div key={b.id} className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{b.title}</p>
                    <p className="text-xs text-red-600 mt-0.5">{b.category} · {b.owner}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            <BlockLabel label="Open Tickets" className="mb-0" />
          </div>
          {openTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tickets.</p>
          ) : (
            <div className="space-y-1.5">
              {openTickets.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{t.title}</span>
                  </div>
                  <span className={cn(
                    "shrink-0 text-xs rounded-full px-1.5 py-0.5",
                    t.status === "Blocked" ? "bg-red-100 text-red-700" :
                    t.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {t.status}
                  </span>
                </div>
              ))}
              {openTickets.length > 5 && (
                <p className="text-xs text-muted-foreground">+{openTickets.length - 5} more — see Tickets tab</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Block C: Upcoming Pipeline (interactive timeline) */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <BlockLabel label="Upcoming Pipeline" className="mb-0" />
        </div>
        <PipelineTimeline deadlines={company.deadline} companyId={company.id} />
      </div>

      {/* Block D: Communications Hub */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <BlockLabel label="Last Touchpoint" className="mb-0" />
            </div>
            {!showTouchpoint && (
              <button
                onClick={() => setShowTouchpoint(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                + Log touchpoint
              </button>
            )}
          </div>

          {showTouchpoint ? (
            <div className="space-y-2">
              <Textarea
                value={touchpointContent}
                onChange={(e) => setTouchpointContent(e.target.value)}
                placeholder="What happened in this touchpoint?"
                rows={3}
                className="text-sm resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Select value={touchpointType} onValueChange={(v) => setTouchpointType(v as ActivityLogType)}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Call", "Meeting", "Email", "Note"] as ActivityLogType[]).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8" onClick={handleTouchpointLog} disabled={touchpointLoading}>
                  {touchpointLoading ? "Logging..." : "Log"}
                </Button>
                <Button size="sm" variant="outline" className="h-8" onClick={() => { setShowTouchpoint(false); setTouchpointContent("") }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : lastActivity ? (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {formatDistanceToNow(new Date(lastActivity.created_at), { addSuffix: true })} · {lastActivity.type}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{lastActivity.content}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <BlockLabel label="Next Required Action" className="mb-0" />
              {!editingAction && (
                <button onClick={() => setEditingAction(true)} className="text-muted-foreground hover:text-slate-900">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {editingAction ? (
              <div className="space-y-2">
                <Textarea
                  value={nextActionInput}
                  onChange={(e) => setNextActionInput(e.target.value)}
                  placeholder="What needs to happen next?"
                  rows={3}
                  className="text-sm resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleActionSave} disabled={actionLoading}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingAction(false); setNextActionInput(company.next_action ?? "") }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : company.next_action ? (
              <p className="text-sm text-slate-700 leading-relaxed">{company.next_action}</p>
            ) : (
              <button onClick={() => setEditingAction(true)} className="text-sm text-blue-600 hover:underline">
                Add next action
              </button>
            )}
          </div>

          <div>
            <BlockLabel label="Ball In Court" className="mb-2" />
            <Select
              value={company.ball_in_court ?? "none"}
              onValueChange={handleBallChange}
              disabled={ballLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Who's responsible?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Not set</SelectItem>
                {BALL_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", ballColors[opt])}>
                      {opt}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {company.ball_in_court && (
              <div className="mt-2">
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", ballColors[company.ball_in_court])}>
                  {company.ball_in_court === "Us" && "Action required from us"}
                  {company.ball_in_court === "Client" && "Waiting on client"}
                  {company.ball_in_court === "Engineering" && "In engineering's hands"}
                  {company.ball_in_court === "Waiting" && "Waiting / on hold"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
