"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TechnicalVault } from "@/types"

type Props = {
  vault: TechnicalVault | null
  companyId: string
}

type VaultField = {
  key: keyof Pick<TechnicalVault, "ftp_info" | "api_keys" | "ssh_config" | "other_secrets">
  label: string
}

const vaultFields: VaultField[] = [
  { key: "ftp_info", label: "FTP Info" },
  { key: "api_keys", label: "API Keys" },
  { key: "ssh_config", label: "SSH Config" },
  { key: "other_secrets", label: "Other Secrets" },
]

export function VaultTab({ vault }: Props) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  if (!vault) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No technical vault configured for this client.
        </p>
      </div>
    )
  }

  const toggleReveal = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const hasAnyData = vaultFields.some((f) => vault[f.key])

  if (!hasAnyData) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Vault exists but no secrets have been stored yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg">
      <p className="text-sm text-muted-foreground">
        All fields are hidden by default. Click the eye icon to reveal.
      </p>
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
