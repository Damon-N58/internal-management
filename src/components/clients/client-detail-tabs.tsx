"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { VaultTab } from "./vault-tab"
import { ActivityTab } from "./activity-tab"
import { TicketsTab } from "./tickets-tab"
import type { Company, TechnicalVault, ActivityLog, Ticket, Deadline } from "@/types"

type FullCompany = Company & {
  vault: TechnicalVault | null
  tickets: Ticket[]
  activityLogs: ActivityLog[]
  deadlines: Deadline[]
}

type Props = { company: FullCompany }

export function ClientDetailTabs({ company }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="vault">Technical Vault</TabsTrigger>
        <TabsTrigger value="activity">
          Activity Feed
          {company.activityLogs.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
              {company.activityLogs.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="tickets">
          Tickets
          {company.tickets.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
              {company.tickets.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        <OverviewTab company={company} />
      </TabsContent>
      <TabsContent value="vault" className="mt-6">
        <VaultTab vault={company.vault} companyId={company.id} />
      </TabsContent>
      <TabsContent value="activity" className="mt-6">
        <ActivityTab logs={company.activityLogs} companyId={company.id} />
      </TabsContent>
      <TabsContent value="tickets" className="mt-6">
        <TicketsTab tickets={company.tickets} companyId={company.id} />
      </TabsContent>
    </Tabs>
  )
}
