"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, ChevronRight, ArchiveRestore } from "lucide-react"
import { unarchiveCompany } from "@/actions/companies"
import { toast } from "sonner"
import { format } from "date-fns"
import type { Company } from "@/types"

type Props = {
  companies: Company[]
}

export function ArchivedCompaniesList({ companies }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  if (companies.length === 0) return null

  const handleRestore = async (company: Company) => {
    setRestoringId(company.id)
    const result = await unarchiveCompany(company.id)
    setRestoringId(null)
    if (result.error) {
      toast.error("Failed to restore company", { description: result.error })
      return
    }
    toast.success(`${company.name} restored`)
    router.refresh()
  }

  return (
    <div className="rounded-lg border bg-slate-50">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-slate-900 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Archived Clients ({companies.length})
        </span>
      </button>

      {open && (
        <div className="border-t divide-y">
          {companies.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-white">
              <div>
                <Link
                  href={`/clients/${c.id}`}
                  className="text-sm font-medium hover:underline text-slate-700"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Archived {c.archived_at ? format(new Date(c.archived_at), "MMM d, yyyy") : "—"}
                  {" · "}{c.primary_csm}
                </p>
              </div>
              <button
                onClick={() => handleRestore(c)}
                disabled={restoringId === c.id}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-slate-900 disabled:opacity-50 transition-colors"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
                {restoringId === c.id ? "Restoring..." : "Restore"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
