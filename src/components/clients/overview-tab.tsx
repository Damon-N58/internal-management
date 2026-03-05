"use client"

import { useState } from "react"
import { format, addDays, differenceInDays, isBefore } from "date-fns"
import {
  ExternalLink,
  FolderOpen,
  Pencil,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateGoogleDriveUrl, updateContractInfo } from "@/actions/companies"
import type { Company, TechnicalVault, ActivityLog, Deadline, Blocker } from "@/types"

type FullCompany = Company & {
  technical_vault: TechnicalVault | null
  activity_log: ActivityLog[]
  deadline: Deadline[]
  blocker: Blocker[]
}

type AttentionReason = {
  label: string
  severity: "critical" | "warning"
}

function getAttentionReasons(company: FullCompany): AttentionReason[] {
  const reasons: AttentionReason[] = []
  const sixtyDaysOut = addDays(new Date(), 60)

  if (company.health_score > 0 && company.health_score <= 2) {
    reasons.push({ label: `Health score: ${company.health_score}/5`, severity: "critical" })
  }

  const openBlockers = company.blocker.filter((b) => b.status === "Open")
  const staleBlockers = openBlockers.filter(
    (b) => differenceInDays(new Date(), new Date(b.updated_at)) > 5
  )
  if (staleBlockers.length > 0) {
    reasons.push({
      label: `${staleBlockers.length} stale blocker${staleBlockers.length > 1 ? "s" : ""}`,
      severity: "warning",
    })
  }
  if (openBlockers.length > 0 && company.health_score <= 3) {
    reasons.push({
      label: `${openBlockers.length} open blocker${openBlockers.length > 1 ? "s" : ""}`,
      severity: "warning",
    })
  }

  if (company.contract_end_date && isBefore(new Date(company.contract_end_date), sixtyDaysOut)) {
    const daysLeft = differenceInDays(new Date(company.contract_end_date), new Date())
    reasons.push({
      label:
        daysLeft < 0
          ? `Contract expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago`
          : `Contract expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      severity: daysLeft <= 14 ? "critical" : "warning",
    })
  }

  return reasons
}

export function OverviewTab({ company }: { company: FullCompany }) {
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Google Drive state
  const [editingDrive, setEditingDrive] = useState(false)
  const [driveUrl, setDriveUrl] = useState(company.google_drive_url ?? "")

  // Contract state
  const [editingContract, setEditingContract] = useState(false)
  const [contractStartDate, setContractStartDate] = useState(company.contract_start_date ?? "")
  const [contractEndDate, setContractEndDate] = useState(company.contract_end_date ?? "")

  const openBlockers = company.blocker.filter((b) => b.status === "Open")
  const attentionReasons = getAttentionReasons(company)
  const handoffMarkdown = generateHandoffMarkdown(company)

  const hasContract = !!company.contract_start_date || !!company.contract_end_date

  const contractDaysLeft =
    company.contract_end_date
      ? differenceInDays(new Date(company.contract_end_date), new Date())
      : null

  const handleCopy = () => {
    navigator.clipboard.writeText(handoffMarkdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveDrive = async () => {
    await updateGoogleDriveUrl(company.id, driveUrl)
    setEditingDrive(false)
  }

  const handleSaveContract = async () => {
    await updateContractInfo(company.id, {
      contract_start_date: contractStartDate || null,
      contract_end_date: contractEndDate || null,
    })
    setEditingContract(false)
  }

  const handleCancelContract = () => {
    setContractStartDate(company.contract_start_date ?? "")
    setContractEndDate(company.contract_end_date ?? "")
    setEditingContract(false)
  }

  const handleClearContract = async () => {
    setContractStartDate("")
    setContractEndDate("")
    await updateContractInfo(company.id, { contract_start_date: null, contract_end_date: null })
    setEditingContract(false)
  }

  return (
    <div className="space-y-6">
      {attentionReasons.length > 0 && (
        <div
          className={`rounded-lg border p-4 ${
            attentionReasons.some((r) => r.severity === "critical")
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle
              className={`h-4 w-4 ${
                attentionReasons.some((r) => r.severity === "critical")
                  ? "text-red-600"
                  : "text-amber-600"
              }`}
            />
            <h3 className="text-sm font-semibold text-slate-800">Why this account needs attention</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {attentionReasons.map((r, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  r.severity === "critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {r.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Company Google Drive
          </h3>
          <button
            onClick={() => setEditingDrive(!editingDrive)}
            className="text-muted-foreground hover:text-slate-900"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        {editingDrive ? (
          <div className="flex gap-2">
            <Input
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="text-sm"
            />
            <Button size="sm" onClick={handleSaveDrive}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingDrive(false)}>Cancel</Button>
          </div>
        ) : company.google_drive_url ? (
          <a
            href={company.google_drive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            Open Google Drive Folder
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            No Google Drive link set.{" "}
            <button onClick={() => setEditingDrive(true)} className="text-blue-600 hover:underline">
              Add one
            </button>
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Contract
          </h3>
          {!editingContract && (
            <button
              onClick={() => setEditingContract(true)}
              className="text-muted-foreground hover:text-slate-900"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {editingContract ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Start Date</label>
                <Input
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">End Date</label>
                <Input
                  type="date"
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSaveContract}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancelContract}>Cancel</Button>
              {hasContract && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-red-600 ml-auto"
                  onClick={handleClearContract}
                >
                  No contract
                </Button>
              )}
            </div>
          </div>
        ) : hasContract ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-700">
              {company.contract_start_date
                ? format(new Date(company.contract_start_date), "MMM d, yyyy")
                : "—"}
              {" → "}
              {company.contract_end_date
                ? format(new Date(company.contract_end_date), "MMM d, yyyy")
                : "—"}
            </span>
            {contractDaysLeft !== null && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  contractDaysLeft < 0
                    ? "bg-red-100 text-red-700"
                    : contractDaysLeft <= 14
                    ? "bg-red-100 text-red-700"
                    : contractDaysLeft <= 60
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {contractDaysLeft < 0
                  ? `Expired ${Math.abs(contractDaysLeft)}d ago`
                  : `${contractDaysLeft}d remaining`}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No contract set.{" "}
            <button
              onClick={() => setEditingContract(true)}
              className="text-blue-600 hover:underline"
            >
              Add one
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Current Objectives" content={company.current_objectives} />
        <Section title="Future Work" content={company.future_work} />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Active Blockers</h3>
        {openBlockers.length === 0 ? (
          <p className="text-sm text-green-700">No open blockers</p>
        ) : (
          <div className="space-y-1">
            {openBlockers.map((b) => (
              <div key={b.id} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="font-medium">{b.title}</span>
                <span className="text-muted-foreground">— {b.category} · {b.owner}</span>
              </div>
            ))}
            <p className="mt-2 text-xs text-muted-foreground">
              See the Blockers tab for full details and resolution tracking.
            </p>
          </div>
        )}
      </div>

      {company.deadline.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-sm">Upcoming Deadlines</h3>
          <ul className="space-y-2">
            {company.deadline.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded border bg-white px-4 py-2.5 text-sm"
              >
                <span>{d.description}</span>
                <span className="text-muted-foreground">
                  {format(new Date(d.due_date), "MMM d, yyyy")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={() => setHandoffOpen(true)}>Generate Handoff Report</Button>

      <Dialog open={handoffOpen} onOpenChange={setHandoffOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Handoff Report — {company.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded bg-slate-50 p-4 text-sm font-mono leading-relaxed">
              {handoffMarkdown}
            </pre>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Section({
  title,
  content,
}: {
  title: string
  content: string | null | undefined
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {content ?? "No data recorded."}
      </p>
    </div>
  )
}

function generateHandoffMarkdown(company: FullCompany): string {
  const recentLogs = company.activity_log.slice(0, 3)
  const openBlockers = company.blocker.filter((b) => b.status === "Open")

  const vaultSummary = company.technical_vault
    ? [
        `- FTP: ${company.technical_vault.ftp_info ? "Configured" : "Not set"}`,
        `- API Keys: ${company.technical_vault.api_keys ? "Configured" : "Not set"}`,
        `- SSH: ${company.technical_vault.ssh_config ? "Configured" : "Not set"}`,
        `- Other: ${company.technical_vault.other_secrets ? "Configured" : "Not set"}`,
      ].join("\n")
    : "No vault configured."

  const blockerLines =
    openBlockers.length > 0
      ? openBlockers
          .map((b) => `- [${b.category}] ${b.title} — Owner: ${b.owner}`)
          .join("\n")
      : "No open blockers."

  const deadlineLines =
    company.deadline.length > 0
      ? company.deadline
          .map((d) => `- ${d.description} — due ${format(new Date(d.due_date), "MMM d, yyyy")}`)
          .join("\n")
      : "No upcoming deadlines."

  const activityLines =
    recentLogs.length > 0
      ? recentLogs
          .map(
            (l) =>
              `- [${l.type}] ${format(new Date(l.created_at), "MMM d, yyyy")}: ${l.content}`
          )
          .join("\n")
      : "No recent activity."

  const contractLine =
    company.contract_start_date || company.contract_end_date
      ? `- Contract: ${company.contract_start_date ? format(new Date(company.contract_start_date), "MMM d, yyyy") : "?"} → ${company.contract_end_date ? format(new Date(company.contract_end_date), "MMM d, yyyy") : "?"}`
      : "- Contract: Not set"

  return `# Handoff Report: ${company.name}
Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}

## Status
- Health Score: ${company.health_score}/5
- Account Status: ${company.status}
- Primary CSM: ${company.primary_csm}
- Implementation Lead: ${company.implementation_lead}
${company.second_lead ? `- Second Lead: ${company.second_lead}` : ""}
${contractLine}

## Current Objectives
${company.current_objectives ?? "None recorded."}

## Active Blockers
${blockerLines}

## Future Work
${company.future_work ?? "None recorded."}

## Upcoming Deadlines
${deadlineLines}

## Technical Vault Summary
${vaultSummary}

## Recent Activity (Last 3 Entries)
${activityLines}
`
}
