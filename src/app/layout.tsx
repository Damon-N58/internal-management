import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { NotificationBellWrapper } from "@/components/layout/notification-bell-wrapper"
import { TodoButtonWrapper } from "@/components/layout/todo-button-wrapper"
import { Toaster } from "@/components/ui/sonner"
import { getCurrentUser } from "@/lib/auth"

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

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {profile ? (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              profile={profile}
              notificationBell={<NotificationBellWrapper />}
              todoButton={<TodoButtonWrapper />}
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
