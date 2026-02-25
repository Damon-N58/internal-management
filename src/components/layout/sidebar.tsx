"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Ticket,
  ChevronDown,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useClerk, UserButton } from "@clerk/nextjs"
import { Separator } from "@/components/ui/separator"
import { getFaviconUrl } from "@/lib/favicon"
import type { ReactNode } from "react"
import type { Profile } from "@/types"

type AssignedCompany = {
  id: string
  name: string
  website: string | null
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/product", label: "Product Roadmap", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: BarChart3, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
]

type Props = {
  profile: Profile
  notificationBell?: ReactNode
  todoButton?: ReactNode
  assignedCompanies?: AssignedCompany[]
}

export function Sidebar({ profile, notificationBell, todoButton, assignedCompanies = [] }: Props) {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const [clientsExpanded, setClientsExpanded] = useState(false)

  const handleLogout = () => {
    signOut({ redirectUrl: "/login" })
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
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {navItems.filter((item) => !("adminOnly" in item && item.adminOnly) || profile.role === "Admin").map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href)
          const isClients = href === "/clients"

          return (
            <div key={href}>
              <div className="flex items-center">
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors flex-1",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
                {isClients && assignedCompanies.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setClientsExpanded(!clientsExpanded)
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        clientsExpanded && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>
              {isClients && clientsExpanded && assignedCompanies.length > 0 && (
                <div className="ml-4 mt-0.5 mb-1 space-y-0.5">
                  {assignedCompanies.map((company) => {
                    const favicon = getFaviconUrl(company.website)
                    const isCompanyActive = pathname === `/clients/${company.id}`
                    return (
                      <Link
                        key={company.id}
                        href={`/clients/${company.id}`}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          isCompanyActive
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                      >
                        {favicon ? (
                          <Image
                            src={favicon}
                            alt=""
                            width={14}
                            height={14}
                            className="rounded-sm shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-sm bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 shrink-0">
                            {company.name.charAt(0)}
                          </div>
                        )}
                        <span className="truncate">{company.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <Separator />
      <div className="pt-4 space-y-3">
        <div className="flex items-center gap-3 px-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
          </div>
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
