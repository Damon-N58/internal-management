"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
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
      <div className="grid gap-3">
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clients yet.</p>
        ) : (
          companies.filter((c) => c.id !== "_general").map((company) => {
            const favicon = getFaviconUrl(company.website)
            return (
              <Link key={company.id} href={`/clients/${company.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      {favicon ? (
                        <Image
                          src={favicon}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-sm"
                          unoptimized
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-sm bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium">{company.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {company.primary_csm}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <HealthBadge score={company.health_score} />
                      <StatusBadge status={company.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
