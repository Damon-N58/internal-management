"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { GripVertical, DollarSign, User, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFaviconUrl } from "@/lib/favicon"
import { updatePipelineStage } from "@/actions/companies"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Company, Blocker } from "@/types"

type PipelineCompany = Company & { blocker: Blocker[] }

type Props = {
  companies: PipelineCompany[]
}

const STAGES = [
  { key: "Signed", color: "border-slate-400", bg: "bg-slate-50", dot: "bg-slate-400" },
  { key: "Onboarding", color: "border-blue-400", bg: "bg-blue-50", dot: "bg-blue-400" },
  { key: "POC Live", color: "border-amber-400", bg: "bg-amber-50", dot: "bg-amber-400" },
  { key: "Full Contract", color: "border-green-400", bg: "bg-green-50", dot: "bg-green-500" },
  { key: "Expansion Work", color: "border-purple-400", bg: "bg-purple-50", dot: "bg-purple-500" },
] as const

function ragDot(score: number) {
  if (score <= 2) return "bg-red-500"
  if (score === 3) return "bg-amber-400"
  return "bg-green-500"
}

function ragLabel(score: number) {
  if (score <= 2) return "text-red-600"
  if (score === 3) return "text-amber-600"
  return "text-green-600"
}

function formatUsd(value: number | null) {
  if (value == null) return null
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}

export function PipelineKanban({ companies }: Props) {
  const router = useRouter()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    const companyId = e.dataTransfer.getData("text/plain")
    setDragId(null)
    setDragOverStage(null)
    if (!companyId) return
    const company = companies.find((c) => c.id === companyId)
    if (!company || company.pipeline_stage === stage) return
    const result = await updatePipelineStage(company.id, stage)
    if (result.error) {
      toast.error("Failed to update stage", { description: result.error })
      return
    }
    router.refresh()
  }

  // Companies with no stage go in "Signed" by default for display, but we show them separately
  const unstagedCompanies = companies.filter((c) => !c.pipeline_stage)
  const stagedCompanies = companies.filter((c) => !!c.pipeline_stage)

  return (
    <div className="space-y-4">
      {unstagedCompanies.length > 0 && (
        <div className="rounded-lg border border-dashed bg-slate-50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {unstagedCompanies.length} client{unstagedCompanies.length !== 1 ? "s" : ""} not yet assigned to a stage
          </p>
          <div className="flex flex-wrap gap-2">
            {unstagedCompanies.map((company) => (
              <div
                key={company.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData("text/plain", company.id); setDragId(company.id) }}
                onDragEnd={() => { setDragId(null); setDragOverStage(null) }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium cursor-grab active:cursor-grabbing hover:bg-slate-50",
                  dragId === company.id && "opacity-40"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", ragDot(company.health_score))} />
                <Link
                  href={`/clients/${company.id}?tab=csm`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {company.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3 min-h-[calc(100vh-20rem)]">
        {STAGES.map(({ key, color, bg, dot }) => {
          const col = stagedCompanies.filter((c) => c.pipeline_stage === key)
          const isOver = dragOverStage === key
          const totalValue = col.reduce((sum, c) => sum + (c.contract_value ?? 0), 0)

          return (
            <div
              key={key}
              className={cn(
                "rounded-lg border-t-2 p-2.5 flex flex-col transition-colors",
                color,
                isOver ? "bg-slate-100" : "bg-slate-50/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(key) }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null) }}
              onDrop={(e) => handleDrop(e, key)}
            >
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                  <span className="text-xs font-semibold text-slate-700">{key}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium", bg)}>
                    {col.length}
                  </span>
                </div>
              </div>

              {totalValue > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 px-0.5">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatUsd(totalValue)}</span>
                </div>
              )}

              <div className="space-y-2 flex-1 overflow-y-auto">
                {col.map((company) => {
                  const favicon = getFaviconUrl(company.website)
                  const activeBlocker = company.blocker.find((b) => b.status === "Open")
                  const value = formatUsd(company.contract_value)

                  return (
                    <div
                      key={company.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", company.id); setDragId(company.id) }}
                      onDragEnd={() => { setDragId(null); setDragOverStage(null) }}
                      className={cn(
                        "rounded-lg border bg-white p-2.5 cursor-grab active:cursor-grabbing group hover:shadow-sm transition-shadow",
                        dragId === company.id && "opacity-40"
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="h-3.5 w-3.5 text-slate-300 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {favicon ? (
                              <Image src={favicon} alt="" width={14} height={14} className="rounded-sm shrink-0" unoptimized />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-sm bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 shrink-0">
                                {company.name.charAt(0)}
                              </div>
                            )}
                            <Link
                              href={`/clients/${company.id}?tab=csm`}
                              className="text-xs font-semibold leading-tight hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {company.name}
                            </Link>
                            <span className={cn("h-2 w-2 rounded-full shrink-0 ml-auto", ragDot(company.health_score))} />
                          </div>

                          <div className="space-y-0.5">
                            {value && (
                              <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                                <DollarSign className="h-3 w-3 text-slate-400" />
                                {value}
                              </div>
                            )}
                            {company.primary_csm && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {company.primary_csm}
                              </div>
                            )}
                            {activeBlocker && (
                              <div className="flex items-start gap-1 text-xs text-red-600 mt-1">
                                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                <span className="leading-tight line-clamp-2">{activeBlocker.title}</span>
                              </div>
                            )}
                            {company.ball_in_court && (
                              <div className={cn(
                                "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium mt-1",
                                company.ball_in_court === "Client" ? "bg-orange-100 text-orange-700" :
                                company.ball_in_court === "Us" ? "bg-blue-100 text-blue-700" :
                                company.ball_in_court === "Engineering" ? "bg-purple-100 text-purple-700" :
                                "bg-slate-100 text-slate-600"
                              )}>
                                {company.ball_in_court}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {col.length === 0 && (
                  <div className={cn(
                    "flex items-center justify-center h-16 text-xs text-muted-foreground border border-dashed rounded-lg transition-colors",
                    isOver && "border-slate-400 bg-white"
                  )}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
