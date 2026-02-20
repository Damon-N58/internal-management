"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, ClipboardList, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase-browser"
import type { ReactNode } from "react"
import type { Profile } from "@/types"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/product", label: "Product Roadmap", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
]

type Props = {
  profile: Profile
  notificationBell?: ReactNode
  todoButton?: ReactNode
}

export function Sidebar({ profile, notificationBell, todoButton }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-white px-4 py-6 shrink-0">
      <div className="mb-8 flex items-center justify-between px-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Nineteen58</h1>
          <p className="text-xs text-muted-foreground">Internal Ops Portal</p>
        </div>
        <div className="flex items-center gap-1">
          {todoButton}
          {notificationBell}
        </div>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t pt-4 space-y-2">
        <div className="px-3">
          <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
