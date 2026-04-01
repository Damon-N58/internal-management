"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { archiveCompany } from "@/actions/companies"
import { toast } from "sonner"

type Props = {
  companyId: string
  companyName: string
}

export function ArchiveCompanyButton({ companyId, companyName }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleArchive = async () => {
    setLoading(true)
    const result = await archiveCompany(companyId)
    setLoading(false)
    if (result.error) {
      toast.error("Failed to archive company", { description: result.error })
      return
    }
    toast.success(`${companyName} has been archived`)
    router.push("/clients")
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Archive {companyName}?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleArchive}
          disabled={loading}
        >
          {loading ? "Archiving..." : "Yes, archive"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirm(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-muted-foreground hover:text-slate-900"
      onClick={() => setConfirm(true)}
    >
      <Archive className="h-4 w-4" />
      Archive
    </Button>
  )
}
