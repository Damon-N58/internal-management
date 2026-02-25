"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileTab } from "./profile-tab"
import { TeamTab } from "./team-tab"
import { AssignmentsTab } from "./assignments-tab"
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
  profile: Profile
  profiles: Profile[]
  assignments: Assignment[]
  companies: CompanyWithStaff[]
  isAdmin: boolean
  isManagerOrAbove: boolean
}

export function SettingsTabs({
  profile,
  profiles,
  assignments,
  companies,
  isAdmin,
  isManagerOrAbove,
}: Props) {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        {isManagerOrAbove && <TabsTrigger value="team">Team</TabsTrigger>}
        {isAdmin && <TabsTrigger value="assignments">Client Assignments</TabsTrigger>}
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <ProfileTab />
      </TabsContent>

      {isManagerOrAbove && (
        <TabsContent value="team" className="mt-6">
          <TeamTab
            profiles={profiles}
            currentUserId={profile.id}
            isAdmin={isAdmin}
          />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="assignments" className="mt-6">
          <AssignmentsTab
            assignments={assignments as Assignment[]}
            profiles={profiles}
            companies={companies}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}
