"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { X } from "lucide-react"
import { assignUserToCompany, unassignUserFromCompany } from "@/actions/assignments"
import { updateCompanyStaff } from "@/actions/companies"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Profile } from "@/types"

type Assignment = {
  id: string
  user_id: string
  company_id: string
  profile: { id: string; full_name: string; email: string }
  company: { id: string; name: string }
}

type CompanyWithStaff = {
  id: string
  name: string
  primary_csm: string
  implementation_lead: string
  second_lead: string | null
  third_lead: string | null
}

type Props = {
  assignments: Assignment[]
  profiles: Profile[]
  companies: CompanyWithStaff[]
}

export function AssignmentsTab({ assignments, profiles, companies }: Props) {
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAssign = async () => {
    if (!selectedUser || !selectedCompany) return
    setLoading(true)
    await assignUserToCompany(selectedUser, selectedCompany)
    setSelectedUser("")
    setSelectedCompany("")
    setLoading(false)
  }

  const handleUnassign = async (userId: string, companyId: string) => {
    await unassignUserFromCompany(userId, companyId)
  }

  const handleStaffChange = async (
    companyId: string,
    field: "primary_csm" | "implementation_lead" | "second_lead" | "third_lead",
    value: string
  ) => {
    const clean = !value || value === "_none" ? null : value
    await updateCompanyStaff(companyId, field, clean)
    router.refresh()
    toast.success("Updated")
  }

  const getMembersForCompany = (companyId: string) =>
    assignments.filter((a) => a.company_id === companyId).map((a) => a.profile)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold">Assign Team Member to Client</h3>
        <div className="flex gap-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select person..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select client..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAssign}
            disabled={loading || !selectedUser || !selectedCompany}
            size="sm"
          >
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Company</TableHead>
              <TableHead>CSM</TableHead>
              <TableHead>Lead Engineer</TableHead>
              <TableHead>2nd Engineer</TableHead>
              <TableHead>3rd Engineer</TableHead>
              <TableHead>Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.filter((c) => c.id !== "_general").map((company) => {
              const members = getMembersForCompany(company.id)
              return (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <StaffSelect
                      value={company.primary_csm}
                      profiles={profiles}
                      onChange={(v) => handleStaffChange(company.id, "primary_csm", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <StaffSelect
                      value={company.implementation_lead}
                      profiles={profiles}
                      onChange={(v) => handleStaffChange(company.id, "implementation_lead", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <StaffSelect
                      value={company.second_lead ?? ""}
                      profiles={profiles}
                      onChange={(v) => handleStaffChange(company.id, "second_lead", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <StaffSelect
                      value={company.third_lead ?? ""}
                      profiles={profiles}
                      onChange={(v) => handleStaffChange(company.id, "third_lead", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {members.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        members.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs"
                          >
                            {m.full_name || m.email}
                            <button
                              onClick={() => handleUnassign(m.id, company.id)}
                              className="text-muted-foreground hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StaffSelect({
  value,
  profiles,
  onChange,
}: {
  value: string
  profiles: Profile[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value || "_none"} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs w-[140px]">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">None</SelectItem>
        {profiles.map((p) => (
          <SelectItem key={p.id} value={p.full_name || p.email}>
            {p.full_name || p.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
