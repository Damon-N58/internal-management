"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfileName } from "@/actions/team"
import type { Profile } from "@/types"

type Props = { profile: Profile }

export function ProfileTab({ profile }: Props) {
  const [name, setName] = useState(profile.full_name)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await updateProfileName(name)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h3 className="text-sm font-semibold">Your Profile</h3>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={profile.email} disabled className="bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Input value={profile.role} disabled className="bg-slate-50" />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={loading || name === profile.full_name}
            size="sm"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </div>
      </div>
    </div>
  )
}
