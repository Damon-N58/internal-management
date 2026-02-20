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
import { X } from "lucide-react"
import { assignUserToCompany, unassignUserFromCompany } from "@/actions/assignments"
import type { Profile, Company } from "@/types"

type Assignment = {
  id: string
  user_id: string
  company_id: string
  profile: { id: string; full_name: string; email: string }
  company: { id: string; name: string }
}

type Props = {
  assignments: Assignment[]
  profiles: Profile[]
  companies: Company[]
}

export function AssignmentsTab({ assignments, profiles, companies }: Props) {
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [loading, setLoading] = useState(false)

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

  const grouped = companies.map((company) => ({
    company,
    members: assignments
      .filter((a) => a.company_id === company.id)
      .map((a) => a.profile),
  }))

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

      <div className="space-y-4">
        {grouped.map(({ company, members }) => (
          <div key={company.id} className="rounded-lg border bg-white">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">{company.name}</h4>
              <span className="text-xs text-muted-foreground">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
            {members.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No team members assigned
              </div>
            ) : (
              <div className="divide-y">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-2"
                  >
                    <div>
                      <span className="text-sm">{member.full_name || member.email}</span>
                      {member.full_name && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnassign(member.id, company.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
