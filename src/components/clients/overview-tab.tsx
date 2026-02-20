"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ExternalLink, FolderOpen, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateGoogleDriveUrl } from "@/actions/companies"
import type { Company, TechnicalVault, ActivityLog, Deadline, Blocker } from "@/types"

type FullCompany = Company & {
  technical_vault: TechnicalVault | null
  activity_log: ActivityLog[]
  deadline: Deadline[]
  blocker: Blocker[]
}

export function OverviewTab({ company }: { company: FullCompany }) {
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingDrive, setEditingDrive] = useState(false)
  const [driveUrl, setDriveUrl] = useState(company.google_drive_url ?? "")

  const openBlockers = company.blocker.filter((b) => b.status === "Open")
  const handoffMarkdown = generateHandoffMarkdown(company)

  const handleCopy = () => {
    navigator.clipboard.writeText(handoffMarkdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveDrive = async () => {
    await updateGoogleDriveUrl(company.id, driveUrl)
    setEditingDrive(false)
  }

  return (
    <div className="space-y-6">
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
            <button
              onClick={() => setEditingDrive(true)}
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

  return `# Handoff Report: ${company.name}
Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}

## Status
- Health Score: ${company.health_score}/5
- Account Status: ${company.status}
- Primary CSM: ${company.primary_csm}
- Implementation Lead: ${company.implementation_lead}
${company.second_lead ? `- Second Lead: ${company.second_lead}` : ""}

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
