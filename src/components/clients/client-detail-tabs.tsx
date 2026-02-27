"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { VaultTab } from "./vault-tab"
import { ActivityTab } from "./activity-tab"
import { TicketsTab } from "./tickets-tab"
import { BlockersTab } from "./blockers-tab"
import { KnowledgeBaseTab } from "./knowledge-base-tab"
import type {
  Company,
  TechnicalVault,
  ActivityLog,
  Ticket,
  Deadline,
  Blocker,
  KnowledgeBaseEntry,
} from "@/types"

export type FullCompany = Company & {
  technical_vault: TechnicalVault | null
  ticket: Ticket[]
  activity_log: ActivityLog[]
  deadline: Deadline[]
  blocker: Blocker[]
  knowledge_base_entry: KnowledgeBaseEntry[]
}

export type TeamMember = {
  id: string
  full_name: string
  email: string
}

type Props = {
  company: FullCompany
  teamMembers?: TeamMember[]
}

export function ClientDetailTabs({ company, teamMembers = [] }: Props) {
  const openBlockerCount = company.blocker.filter((b) => b.status === "Open").length
  const openTicketCount = company.ticket.filter((t) => t.status !== "Closed").length
  const today = new Date().toISOString().slice(0, 10)
  const todayActivityCount = company.activity_log.filter(
    (l) => l.created_at.slice(0, 10) === today
  ).length

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="blockers">
          Blockers
          {openBlockerCount > 0 && (
            <span className="ml-1.5 rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-xs">
              {openBlockerCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="tickets">
          Tickets
          {openTicketCount > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
              {openTicketCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="activity">
          Activity
          {todayActivityCount > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
              {todayActivityCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="vault">Technical Vault</TabsTrigger>
        <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <OverviewTab company={company} />
      </TabsContent>
      <TabsContent value="blockers" className="mt-6">
        <BlockersTab blockers={company.blocker} companyId={company.id} />
      </TabsContent>
      <TabsContent value="tickets" className="mt-6">
        <TicketsTab tickets={company.ticket} companyId={company.id} teamMembers={teamMembers} />
      </TabsContent>
      <TabsContent value="activity" className="mt-6">
        <ActivityTab logs={company.activity_log} companyId={company.id} />
      </TabsContent>
      <TabsContent value="vault" className="mt-6">
        <VaultTab vault={company.technical_vault} companyId={company.id} />
      </TabsContent>
      <TabsContent value="knowledge" className="mt-6">
        <KnowledgeBaseTab entries={company.knowledge_base_entry} companyId={company.id} />
      </TabsContent>
    </Tabs>
  )
}
