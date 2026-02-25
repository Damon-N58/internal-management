"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import { getFaviconUrl } from "@/lib/favicon"
import { cn } from "@/lib/utils"
import type { Company } from "@/types"

type Props = {
  allCompanies: Company[]
  myCompanyIds: string[]
  isAdmin: boolean
}

export function ClientsList({ allCompanies, myCompanyIds, isAdmin }: Props) {
  const [showAll, setShowAll] = useState(false)

  const companies = showAll
    ? allCompanies
    : allCompanies.filter((c) => myCompanyIds.includes(c.id))

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex items-center gap-1 rounded-lg border bg-white p-1 w-fit">
          <button
            onClick={() => setShowAll(false)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              !showAll ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            )}
          >
            My Clients
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              showAll ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            )}
          >
            All Clients
          </button>
        </div>
      )}
      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clients yet.</p>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CSM</TableHead>
                <TableHead>Lead Engineer</TableHead>
                <TableHead>2nd Engineer</TableHead>
                <TableHead>3rd Engineer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.filter((c) => c.id !== "_general").map((company) => {
                const favicon = getFaviconUrl(company.website)
                return (
                  <TableRow key={company.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell>
                      <Link href={`/clients/${company.id}`} className="flex items-center gap-2">
                        {favicon ? (
                          <Image
                            src={favicon}
                            alt=""
                            width={18}
                            height={18}
                            className="rounded-sm shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className="h-[18px] w-[18px] rounded-sm bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                            {company.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{company.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <HealthBadge score={company.health_score} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={company.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.primary_csm || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.implementation_lead || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.second_lead || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.third_lead || "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
