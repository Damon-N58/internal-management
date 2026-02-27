import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { requireAuth, getUserCompanyIds, isAdmin } from "@/lib/auth"
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs"
import { HealthBadge } from "@/components/health-badge"
import { StatusBadge } from "@/components/status-badge"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { escalateStaleBlockers } from "@/actions/blockers"
import { getFaviconUrl } from "@/lib/favicon"
import type { FullCompany } from "@/components/clients/client-detail-tabs"
import type { Profile } from "@/types"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const profile = await requireAuth()

  if (!isAdmin(profile)) {
    const companyIds = await getUserCompanyIds(profile.id)
    if (!companyIds.includes(id)) notFound()
  }

  escalateStaleBlockers().catch(() => {})

  const [{ data: company }, { data: teamMembers }] = await Promise.all([
    supabase
      .from("company")
      .select(
        "*, technical_vault(*), ticket(*), activity_log(*), deadline(*), blocker(*), knowledge_base_entry(*)"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("user_company_assignment")
      .select("user_id, profile:user_id(id, full_name, email)")
      .eq("company_id", id),
  ])

  if (!company) notFound()

  const assignableUsers = (teamMembers ?? []).map((m) => {
    const p = m.profile as unknown as Profile
    return { id: p.id, full_name: p.full_name, email: p.email }
  })

  const fullCompany = {
    ...company,
    technical_vault: (company.technical_vault ?? null) as unknown as FullCompany["technical_vault"],
    ticket: (company.ticket ?? []) as unknown as FullCompany["ticket"],
    activity_log: (company.activity_log ?? []) as unknown as FullCompany["activity_log"],
    deadline: (company.deadline ?? []) as unknown as FullCompany["deadline"],
    blocker: (company.blocker ?? []) as unknown as FullCompany["blocker"],
    knowledge_base_entry: (company.knowledge_base_entry ?? []) as unknown as FullCompany["knowledge_base_entry"],
  } as FullCompany

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {getFaviconUrl(company.website) ? (
              <Image
                src={getFaviconUrl(company.website)!}
                alt=""
                width={28}
                height={28}
                className="rounded-sm shrink-0"
                unoptimized
              />
            ) : (
              <div className="h-7 w-7 rounded-sm bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                {company.name.charAt(0)}
              </div>
            )}
            <h2 className="text-2xl font-bold tracking-tight">{company.name}</h2>
          </div>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <HealthBadge score={company.health_score} />
            <StatusBadge status={company.status} />
            <span className="text-sm text-muted-foreground">CSM: {company.primary_csm}</span>
            <span className="text-sm text-muted-foreground">
              Lead: {company.implementation_lead}
            </span>
          </div>
        </div>
      </div>

      <ClientDetailTabs company={fullCompany} teamMembers={assignableUsers} />
    </div>
  )
}
