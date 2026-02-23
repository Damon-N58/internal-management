"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCompany } from "@/actions/companies"
import { toast } from "sonner"

type Profile = { id: string; full_name: string; email: string }

type Props = {
  profiles: Profile[]
}

export function AddCompanyDialog({ profiles }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [status, setStatus] = useState("Active")
  const [primaryCsm, setPrimaryCsm] = useState("")
  const [implementationLead, setImplementationLead] = useState("")
  const [secondLead, setSecondLead] = useState("")
  const [thirdLead, setThirdLead] = useState("")
  const [contractEndDate, setContractEndDate] = useState("")
  const [website, setWebsite] = useState("")

  const handleSubmit = async () => {
    if (!name.trim() || !primaryCsm) return
    setLoading(true)
    const result = await createCompany({
      name: name.trim(),
      status,
      primary_csm: primaryCsm,
      implementation_lead: implementationLead || null,
      second_lead: secondLead || null,
      third_lead: thirdLead || null,
      contract_end_date: contractEndDate || null,
      website: website.trim() || null,
    })
    setLoading(false)
    if (result.error) {
      toast.error("Failed to create company", { description: result.error })
      return
    }
    setOpen(false)
    setName("")
    setStatus("Active")
    setPrimaryCsm("")
    setImplementationLead("")
    setSecondLead("")
    setThirdLead("")
    setContractEndDate("")
    setWebsite("")
    router.refresh()
  }

  const profileOptions = profiles.map((p) => ({
    value: p.full_name || p.email,
    label: p.full_name || p.email,
  }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POC">POC</SelectItem>
                <SelectItem value="Implementation">Implementation</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Churn Risk">Churn Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Primary CSM *</Label>
            <Select value={primaryCsm} onValueChange={setPrimaryCsm}>
              <SelectTrigger>
                <SelectValue placeholder="Select CSM" />
              </SelectTrigger>
              <SelectContent>
                {profileOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Implementation Engineers</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Lead</p>
                <Select value={implementationLead} onValueChange={setImplementationLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {profileOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">2nd</p>
                <Select value={secondLead} onValueChange={setSecondLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="2nd" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {profileOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">3rd</p>
                <Select value={thirdLead} onValueChange={setThirdLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="3rd" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {profileOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-end">Contract End Date <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="contract-end"
              type="date"
              value={contractEndDate}
              onChange={(e) => setContractEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !primaryCsm}
            >
              {loading ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
