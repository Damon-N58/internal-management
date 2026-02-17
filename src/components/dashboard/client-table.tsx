"use client"

import Link from "next/link"
import { addDays, isBefore } from "date-fns"
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
import { cn } from "@/lib/utils"
import type { Company, Deadline, ActivityLog } from "@/types"

type CompanyWithRelations = Company & {
  deadlines: Deadline[]
  activityLogs: ActivityLog[]
}

type Props = {
  companies: CompanyWithRelations[]
}

export function ClientTable({ companies }: Props) {
  const sixtyDaysOut = addDays(new Date(), 60)

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">All Clients</h3>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Primary CSM</TableHead>
              <TableHead>Objectives</TableHead>
              <TableHead>Blockers</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No clients yet. Add your first client to get started.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => {
                const nearExpiry =
                  company.contractEndDate &&
                  isBefore(new Date(company.contractEndDate), sixtyDaysOut)

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
                      {nearExpiry && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">
                          ⚠ Contract expiring
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <HealthBadge score={company.healthScore} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={company.status} />
                    </TableCell>
                    <TableCell className="text-sm">{company.primaryCSM}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {company.currentObjectives ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {company.internalBlockers ?? company.externalBlockers ?? "—"}
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
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
