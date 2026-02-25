"use client"

import { useState } from "react"
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

type View = "all" | "sales" | "engineering"

type Props = {
  companies: CompanyWithRelations[]
}

export function ClientTable({ companies }: Props) {
  const [view, setView] = useState<View>("all")
  const sixtyDaysOut = addDays(new Date(), 60)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <h3 className="text-lg font-semibold">All Clients</h3>
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sales">Sales View</TabsTrigger>
            <TabsTrigger value="engineering">Engineering View</TabsTrigger>
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
                const openBlockers = company.blocker.filter((b) => b.status === "Open").length
                const openTickets = company.ticket.filter((t) => t.status !== "Closed").length

                return (
                  <TableRow
                    key={company.id}
                    className={cn(nearExpiry && "bg-amber-50 hover:bg-amber-100")}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${company.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {company.name}
                      </Link>
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
                          {openBlockers > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                              {openBlockers} blocker{openBlockers > 1 ? "s" : ""}
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
