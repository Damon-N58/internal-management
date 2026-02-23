"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
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

export function AddCompanyDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [status, setStatus] = useState("Active")
  const [primaryCsm, setPrimaryCsm] = useState("")
  const [implementationLead, setImplementationLead] = useState("")
  const [contractEndDate, setContractEndDate] = useState("")
  const [website, setWebsite] = useState("")

  const handleSubmit = async () => {
    if (!name.trim() || !primaryCsm.trim() || !implementationLead.trim()) return
    setLoading(true)
    try {
      await createCompany({
        name: name.trim(),
        status,
        primary_csm: primaryCsm.trim(),
        implementation_lead: implementationLead.trim(),
        contract_end_date: contractEndDate || undefined,
        website: website.trim() || undefined,
      })
      setOpen(false)
      setName("")
      setStatus("Active")
      setPrimaryCsm("")
      setImplementationLead("")
      setContractEndDate("")
      setWebsite("")
    } catch {
      // handle error silently
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company Name</Label>
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
            <Label htmlFor="company-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="company-status">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="primary-csm">Primary CSM</Label>
              <Input
                id="primary-csm"
                value={primaryCsm}
                onChange={(e) => setPrimaryCsm(e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="impl-lead">Implementation Lead</Label>
              <Input
                id="impl-lead"
                value={implementationLead}
                onChange={(e) => setImplementationLead(e.target.value)}
                placeholder="Name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contract-end">Contract End Date</Label>
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
              disabled={loading || !name.trim() || !primaryCsm.trim() || !implementationLead.trim()}
            >
              {loading ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
