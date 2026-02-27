"use client"

import { useState } from "react"
import { Eye, EyeOff, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveVault } from "@/actions/vault"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { TechnicalVault } from "@/types"

type Props = {
  vault: TechnicalVault | null
  companyId: string
}

type VaultForm = {
  ftp_info: string
  api_keys: string
  ssh_config: string
  other_secrets: string
}

const vaultFields: { key: keyof VaultForm; label: string }[] = [
  { key: "ftp_info", label: "FTP Info" },
  { key: "api_keys", label: "API Keys" },
  { key: "ssh_config", label: "SSH Config" },
  { key: "other_secrets", label: "Other Secrets" },
]

export function VaultTab({ vault, companyId }: Props) {
  const [editing, setEditing] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<VaultForm>({
    ftp_info: vault?.ftp_info ?? "",
    api_keys: vault?.api_keys ?? "",
    ssh_config: vault?.ssh_config ?? "",
    other_secrets: vault?.other_secrets ?? "",
  })
  const router = useRouter()

  const toggleReveal = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await saveVault(companyId, {
      ftp_info: form.ftp_info || null,
      api_keys: form.api_keys || null,
      ssh_config: form.ssh_config || null,
      other_secrets: form.other_secrets || null,
    })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Vault saved")
    setEditing(false)
    router.refresh()
  }

  const handleCancel = () => {
    setForm({
      ftp_info: vault?.ftp_info ?? "",
      api_keys: vault?.api_keys ?? "",
      ssh_config: vault?.ssh_config ?? "",
      other_secrets: vault?.other_secrets ?? "",
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-5 max-w-lg">
        <p className="text-sm text-muted-foreground">
          Enter secrets below. Leave a field blank to clear it.
        </p>
        {vaultFields.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            <Textarea
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={`Enter ${label.toLowerCase()}...`}
              rows={3}
              className="font-mono text-sm"
            />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm" disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (!vault || !vaultFields.some((f) => vault[f.key])) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {!vault
            ? "No technical vault configured for this client."
            : "Vault exists but no secrets have been stored yet."}
        </p>
        <Button size="sm" onClick={() => setEditing(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Vault Secrets
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          All fields are hidden by default. Click the eye icon to reveal.
        </p>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>
      {vaultFields.map(({ key, label }) => {
        const value = vault[key]
        if (!value) return null
        return (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            <div className="flex items-center gap-2">
              <Input
                type={revealed[key] ? "text" : "password"}
                value={value}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleReveal(key)}
                aria-label={revealed[key] ? `Hide ${label}` : `Reveal ${label}`}
              >
                {revealed[key] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
