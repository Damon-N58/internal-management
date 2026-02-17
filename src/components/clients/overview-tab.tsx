"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Company, TechnicalVault, ActivityLog, Deadline } from "@/types"

type FullCompany = Company & {
  vault: TechnicalVault | null
  activityLogs: ActivityLog[]
  deadlines: Deadline[]
}

export function OverviewTab({ company }: { company: FullCompany }) {
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handoffMarkdown = generateHandoffMarkdown(company)

  const handleCopy = () => {
    navigator.clipboard.writeText(handoffMarkdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Section title="Current Objectives" content={company.currentObjectives} />
        <Section title="Future Work" content={company.futureWork} />
        <Section title="External Blockers" content={company.externalBlockers} />
        <Section title="Internal Blockers" content={company.internalBlockers} />
      </div>

      {company.deadlines.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-sm">Upcoming Deadlines</h3>
          <ul className="space-y-2">
            {company.deadlines.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded border bg-white px-4 py-2.5 text-sm"
              >
                <span>{d.description}</span>
                <span className="text-muted-foreground">
                  {format(new Date(d.dueDate), "MMM d, yyyy")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => setHandoffOpen(true)}>Generate Handoff Report</Button>
      </div>

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
  const recentLogs = company.activityLogs.slice(0, 3)
  const vaultSummary = company.vault
    ? [
        `- FTP: ${company.vault.ftpInfo ? "Configured ✓" : "Not set"}`,
        `- API Keys: ${company.vault.apiKeys ? "Configured ✓" : "Not set"}`,
        `- SSH: ${company.vault.sshConfig ? "Configured ✓" : "Not set"}`,
        `- Other: ${company.vault.otherSecrets ? "Configured ✓" : "Not set"}`,
      ].join("\n")
    : "No vault configured."

  const deadlineLines =
    company.deadlines.length > 0
      ? company.deadlines
          .map((d) => `- ${d.description} — due ${format(new Date(d.dueDate), "MMM d, yyyy")}`)
          .join("\n")
      : "No upcoming deadlines."

  const activityLines =
    recentLogs.length > 0
      ? recentLogs
          .map(
            (l) =>
              `- [${l.type}] ${format(new Date(l.createdAt), "MMM d, yyyy")}: ${l.content}`
          )
          .join("\n")
      : "No recent activity."

  return `# Handoff Report: ${company.name}
Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}

## Status
- Health Score: ${company.healthScore}/5
- Account Status: ${company.status}
- Primary CSM: ${company.primaryCSM}
- Implementation Lead: ${company.implementationLead}
${company.secondLead ? `- Second Lead: ${company.secondLead}` : ""}

## Current Objectives
${company.currentObjectives ?? "None recorded."}

## Blockers
### External
${company.externalBlockers ?? "None."}

### Internal
${company.internalBlockers ?? "None."}

## Future Work
${company.futureWork ?? "None recorded."}

## Upcoming Deadlines
${deadlineLines}

## Technical Vault Summary
${vaultSummary}

## Recent Activity (Last 3 Entries)
${activityLines}
`
}
