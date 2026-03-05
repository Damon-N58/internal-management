"use client"

import { useState } from "react"
import Link from "next/link"
import { addDays, differenceInDays, isBefore } from "date-fns"
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import type { Company, Blocker, Deadline } from "@/types"

type CompanyWithRelations = Company & {
  blocker: Blocker[]
  deadline: Deadline[]
}

type AttentionReason = {
  label: string
  severity: "critical" | "warning"
}

function getAttentionReasons(company: CompanyWithRelations): AttentionReason[] {
  const reasons: AttentionReason[] = []
  const sixtyDaysOut = addDays(new Date(), 60)

  // Score 0 = Self Service — exclude from attention
  if (company.health_score > 0 && company.health_score <= 2) {
    reasons.push({ label: `Health score: ${company.health_score}/5`, severity: "critical" })
  }

  const openBlockers = company.blocker.filter((b) => b.status === "Open")
  const staleBlockers = openBlockers.filter(
    (b) => differenceInDays(new Date(), new Date(b.updated_at)) > 5
  )
  if (staleBlockers.length > 0) {
    reasons.push({ label: `${staleBlockers.length} stale blocker${staleBlockers.length > 1 ? "s" : ""}`, severity: "warning" })
  }
  if (openBlockers.length > 0 && company.health_score <= 3) {
    reasons.push({ label: `${openBlockers.length} open blocker${openBlockers.length > 1 ? "s" : ""}`, severity: "warning" })
  }

  if (
    company.contract_end_date &&
    !company.contract_renewed &&
    isBefore(new Date(company.contract_end_date), sixtyDaysOut)
  ) {
    const daysLeft = differenceInDays(new Date(company.contract_end_date), new Date())
    reasons.push({
      label: `Contract expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      severity: daysLeft <= 14 ? "critical" : "warning",
    })
  }

  return reasons
}

function AttentionRow({ company, reasons }: { company: CompanyWithRelations; reasons: AttentionReason[] }) {
  const hasCritical = reasons.some((r) => r.severity === "critical")
  return (
    <Link href={`/clients/${company.id}`}>
      <div
        className={`flex items-center gap-4 rounded-lg border px-4 py-3 hover:shadow-sm transition-shadow cursor-pointer ${
          hasCritical ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{company.name}</span>
            <StatusBadge status={company.status} />
            <HealthBadge score={company.health_score} />
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
        <span className="text-xs text-muted-foreground shrink-0">{company.primary_csm}</span>
      </div>
    </Link>
  )
}

type Props = {
  companies: CompanyWithRelations[]
}

const PREVIEW_COUNT = 2

export function AttentionSection({ companies }: Props) {
  const [expanded, setExpanded] = useState(false)

  const companiesNeedingAttention = companies
    .map((c) => ({ company: c, reasons: getAttentionReasons(c) }))
    .filter(({ reasons }) => reasons.length > 0)
    .sort((a, b) => {
      const aCritical = a.reasons.some((r) => r.severity === "critical")
      const bCritical = b.reasons.some((r) => r.severity === "critical")
      if (aCritical && !bCritical) return -1
      if (!aCritical && bCritical) return 1
      return a.company.health_score - b.company.health_score
    })

  if (companiesNeedingAttention.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4 text-sm text-green-700">
          All clients are on track — no attention required right now.
        </CardContent>
      </Card>
    )
  }

  const preview = companiesNeedingAttention.slice(0, PREVIEW_COUNT)
  const overflow = companiesNeedingAttention.slice(PREVIEW_COUNT)
  const hiddenCount = overflow.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="font-semibold text-sm">
            Attention Required ({companiesNeedingAttention.length})
          </h3>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {preview.map(({ company, reasons }) => (
          <AttentionRow key={company.id} company={company} reasons={reasons} />
        ))}

        {hiddenCount > 0 && (
          <>
            {/* Smooth collapse using max-height transition */}
            <div
              style={{
                maxHeight: expanded ? `${hiddenCount * 100}px` : "0px",
                overflow: "hidden",
                transition: "max-height 0.35s ease-in-out",
              }}
            >
              <div className="grid gap-2 pt-2">
                {overflow.map(({ company, reasons }) => (
                  <AttentionRow key={company.id} company={company} reasons={reasons} />
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                  Show {hiddenCount} more
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
