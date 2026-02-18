"use client"

import Link from "next/link"
import { addDays, differenceInDays, isBefore } from "date-fns"
import { AlertTriangle } from "lucide-react"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import type { Company, Blocker, Deadline } from "@/types"

type CompanyWithRelations = Company & {
  blockers: Blocker[]
  deadlines: Deadline[]
}

type AttentionReason = {
  label: string
  severity: "critical" | "warning"
}

function getAttentionReasons(company: CompanyWithRelations): AttentionReason[] {
  const reasons: AttentionReason[] = []
  const sixtyDaysOut = addDays(new Date(), 60)

  if (company.healthScore <= 2) {
    reasons.push({ label: `Health score: ${company.healthScore}/5`, severity: "critical" })
  }

  const openBlockers = company.blockers.filter((b) => b.status === "Open")
  const staleBlockers = openBlockers.filter(
    (b) => differenceInDays(new Date(), new Date(b.updatedAt)) > 5
  )
  if (staleBlockers.length > 0) {
    reasons.push({ label: `${staleBlockers.length} stale blocker${staleBlockers.length > 1 ? "s" : ""}`, severity: "warning" })
  }
  if (openBlockers.length > 0 && company.healthScore <= 3) {
    reasons.push({ label: `${openBlockers.length} open blocker${openBlockers.length > 1 ? "s" : ""}`, severity: "warning" })
  }

  if (
    company.contractEndDate &&
    isBefore(new Date(company.contractEndDate), sixtyDaysOut)
  ) {
    const daysLeft = differenceInDays(new Date(company.contractEndDate), new Date())
    reasons.push({
      label: `Contract expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      severity: daysLeft <= 14 ? "critical" : "warning",
    })
  }

  return reasons
}

type Props = {
  companies: CompanyWithRelations[]
}

export function AttentionSection({ companies }: Props) {
  const companiesNeedingAttention = companies
    .map((c) => ({ company: c, reasons: getAttentionReasons(c) }))
    .filter(({ reasons }) => reasons.length > 0)
    .sort((a, b) => {
      const aCritical = a.reasons.some((r) => r.severity === "critical")
      const bCritical = b.reasons.some((r) => r.severity === "critical")
      if (aCritical && !bCritical) return -1
      if (!aCritical && bCritical) return 1
      return a.company.healthScore - b.company.healthScore
    })

  if (companiesNeedingAttention.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
        ✓ All clients are on track — no attention required right now.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="font-semibold text-sm">
          Attention Required ({companiesNeedingAttention.length})
        </h3>
      </div>
      <div className="grid gap-2">
        {companiesNeedingAttention.map(({ company, reasons }) => {
          const hasCritical = reasons.some((r) => r.severity === "critical")
          return (
            <Link href={`/clients/${company.id}`} key={company.id}>
              <div
                className={`flex items-center gap-4 rounded-lg border px-4 py-3 hover:shadow-sm transition-shadow cursor-pointer ${
                  hasCritical
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{company.name}</span>
                    <StatusBadge status={company.status} />
                    <HealthBadge score={company.healthScore} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {reasons.map((r, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-0.5 rounded-full ${
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
                <span className="text-xs text-muted-foreground shrink-0">
                  {company.primaryCSM}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
