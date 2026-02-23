import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { NotificationBellWrapper } from "@/components/layout/notification-bell-wrapper"
import { TodoButtonWrapper } from "@/components/layout/todo-button-wrapper"
import { Toaster } from "@/components/ui/sonner"
import { getCurrentUser, getUserCompanyIds, isAdmin } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Nineteen58 Ops Portal",
  description: "Internal management portal",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const profile = await getCurrentUser()

  let assignedCompanies: { id: string; name: string; website: string | null }[] = []

  if (profile) {
    if (isAdmin(profile)) {
      const { data } = await supabase
        .from("company")
        .select("id, name, website")
        .order("name", { ascending: true })
      assignedCompanies = (data ?? []) as typeof assignedCompanies
    } else {
      const companyIds = await getUserCompanyIds(profile.id)
      if (companyIds.length > 0) {
        const { data } = await supabase
          .from("company")
          .select("id, name, website")
          .in("id", companyIds)
          .order("name", { ascending: true })
        assignedCompanies = (data ?? []) as typeof assignedCompanies
      }
    }
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {profile ? (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              profile={profile}
              notificationBell={<NotificationBellWrapper />}
              todoButton={<TodoButtonWrapper />}
              assignedCompanies={assignedCompanies}
            />
            <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
              {children}
            </main>
          </div>
        ) : (
          <>{children}</>
        )}
        <Toaster />
      </body>
    </html>
  )
}
