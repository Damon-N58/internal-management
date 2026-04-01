"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { createTeamMember, updateUserRole } from "@/actions/team"
import type { Profile, UserRole } from "@/types"

type Props = {
  profiles: Profile[]
  currentUserId: string
  isAdmin: boolean
}

const defaultForm = {
  fullName: "",
  email: "",
  role: "Member" as UserRole,
}

export function TeamTab({ profiles: initialProfiles, currentUserId, isAdmin: admin }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdPassword, setCreatedPassword] = useState("")

  const handleCreate = async () => {
    if (!form.fullName.trim() || !form.email.trim()) return
    setError("")
    setCreatedPassword("")
    setLoading(true)
    try {
      const result = await createTeamMember(form.fullName, form.email, form.role)
      setCreatedPassword(result.tempPassword)
      setForm(defaultForm)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create account")
    }
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, role } : p))
    await updateUserRole(userId, role)
  }

  return (
    <div className="space-y-6">
      {admin && (
        <div className="rounded-lg border bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold">Add Team Member</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@nineteen58.co.za"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {createdPassword && (
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2">
              <p className="text-xs font-medium text-green-800">Account created. Share this temp password with the new member:</p>
              <p className="text-sm font-mono font-bold text-green-900 mt-0.5">{createdPassword}</p>
              <p className="text-xs text-green-700 mt-1">They can change it after first login via Settings.</p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            onClick={handleCreate}
            disabled={loading || !form.fullName.trim() || !form.email.trim()}
            size="sm"
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Team Members ({profiles.length})</h3>
        </div>
        <div className="divide-y">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {p.full_name || "Unnamed"}
                  {p.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {admin && p.id !== currentUserId ? (
                  <Select
                    value={p.role}
                    onValueChange={(v) => handleRoleChange(p.id, v as UserRole)}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={p.role} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
