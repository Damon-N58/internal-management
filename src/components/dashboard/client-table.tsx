"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { addDays, isBefore, format } from "date-fns"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import { updateCompanyStatus } from "@/actions/companies"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Company, Deadline, ActivityLog, Blocker, Ticket } from "@/types"

type CompanyWithRelations = Company & {
  deadline: Deadline[]
  activity_log: ActivityLog[]
  blocker: Blocker[]
  ticket: Ticket[]
}

type View = "all" | "csm" | "sales" | "engineering"

const VIEW_MODE_KEY = "n58_dashboard_view_mode"

const stageColors: Record<string, string> = {
  Signed: "bg-slate-100 text-slate-700",
  Onboarding: "bg-blue-100 text-blue-700",
  "POC Live": "bg-amber-100 text-amber-700",
  "Full Contract": "bg-green-100 text-green-700",
  "Expansion Work": "bg-purple-100 text-purple-700",
}

const ballColors: Record<string, string> = {
  Us: "bg-blue-100 text-blue-700",
  Client: "bg-orange-100 text-orange-700",
  Engineering: "bg-purple-100 text-purple-700",
  Waiting: "bg-slate-100 text-slate-600",
}

function ragDot(score: number) {
  if (score <= 2) return "bg-red-500"
  if (score === 3) return "bg-amber-400"
  return "bg-green-500"
}

function formatUsd(value: number | null) {
  if (value == null) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}

type Props = {
  companies: CompanyWithRelations[]
}

export function ClientTable({ companies }: Props) {
  const [view, setView] = useState<View>("all")
  const [mounted, setMounted] = useState(false)
  const sixtyDaysOut = addDays(new Date(), 60)

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY) as View | null
    if (stored && ["all", "csm", "sales", "engineering"].includes(stored)) setView(stored)
    setMounted(true)
  }, [])

  const handleView = (v: View) => {
    setView(v)
    localStorage.setItem(VIEW_MODE_KEY, v)
  }

  if (!mounted) return null

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <h3 className="text-lg font-semibold">All Clients</h3>
        <Tabs value={view} onValueChange={(v) => handleView(v as View)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="csm">CSM</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="engineering">Engineering</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Status</TableHead>
              {view === "all" && (
                <>
                  <TableHead>Primary CSM</TableHead>
                  <TableHead>Objectives</TableHead>
                  <TableHead>Actions</TableHead>
                </>
              )}
              {view === "csm" && (
                <>
                  <TableHead>Pipeline Stage</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Active Blocker</TableHead>
                  <TableHead>Ball In Court</TableHead>
                </>
              )}
              {view === "sales" && (
                <>
                  <TableHead>CSM</TableHead>
                  <TableHead>Contract End</TableHead>
                  <TableHead>Renewal Risk</TableHead>
                  <TableHead>Actions</TableHead>
                </>
              )}
              {view === "engineering" && (
                <>
                  <TableHead>Lead</TableHead>
                  <TableHead>Open Blockers</TableHead>
                  <TableHead>Open Tickets</TableHead>
                  <TableHead>Last Activity</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No clients yet.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => {
                const nearExpiry =
                  company.contract_end_date &&
                  isBefore(new Date(company.contract_end_date), sixtyDaysOut)
                const openBlockers = company.blocker.filter((b) => b.status === "Open")
                const openTickets = company.ticket.filter((t) => t.status !== "Closed").length
                const firstBlocker = openBlockers[0]

                return (
                  <TableRow
                    key={company.id}
                    className={cn(nearExpiry && view === "sales" && "bg-amber-50 hover:bg-amber-100")}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", ragDot(company.health_score))} />
                        <Link href={`/clients/${company.id}`} className="text-blue-600 hover:underline">
                          {company.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <HealthBadge score={company.health_score} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={company.status} />
                    </TableCell>

                    {view === "all" && (
                      <>
                        <TableCell className="text-sm">{company.primary_csm}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {company.current_objectives ?? "—"}
                        </TableCell>
                        <TableCell>
                          {company.status === "POC" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCompanyStatus(company.id, "Implementation")}
                            >
                              Move to Implementation
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </>
                    )}

                    {view === "csm" && (
                      <>
                        <TableCell>
                          {company.pipeline_stage ? (
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", stageColors[company.pipeline_stage] ?? "bg-slate-100 text-slate-600")}>
                              {company.pipeline_stage}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatUsd(company.contract_value)}
                        </TableCell>
                        <TableCell>
                          {firstBlocker ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700 max-w-[180px] truncate">
                              {firstBlocker.title}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600">✓ Clear</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.ball_in_court ? (
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ballColors[company.ball_in_court] ?? "bg-slate-100 text-slate-600")}>
                              {company.ball_in_court}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </>
                    )}

                    {view === "sales" && (
                      <>
                        <TableCell className="text-sm">{company.primary_csm}</TableCell>
                        <TableCell className="text-sm">
                          {company.contract_end_date
                            ? format(new Date(company.contract_end_date), "MMM d, yyyy")
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {nearExpiry ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                              ⚠ At risk
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.status === "POC" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCompanyStatus(company.id, "Implementation")}
                            >
                              Move to Implementation
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </>
                    )}

                    {view === "engineering" && (
                      <>
                        <TableCell className="text-sm">{company.implementation_lead}</TableCell>
                        <TableCell>
                          {openBlockers.length > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                              {openBlockers.length} blocker{openBlockers.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600">✓ Clear</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {openTickets > 0 ? openTickets : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {company.last_activity_at
                            ? format(new Date(company.last_activity_at), "MMM d")
                            : "Never"}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
