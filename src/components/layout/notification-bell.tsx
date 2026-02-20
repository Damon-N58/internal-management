"use client"

import { useState } from "react"
import { Bell, BellDot, Check, CheckCheck, Clock, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markNotificationRead, markAllNotificationsRead } from "@/actions/notifications"
import { formatDistanceToNow } from "date-fns"
import type { Notification } from "@/types"

type Props = {
  notifications: Notification[]
  unreadCount: number
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  CONTRACT_EXPIRY: { icon: Clock, color: "text-amber-600", label: "Contract Expiry" },
  HEALTH_DROP: { icon: TrendingDown, color: "text-red-600", label: "Health Drop" },
  STALE_BLOCKER: { icon: AlertTriangle, color: "text-orange-600", label: "Stale Blocker" },
  NO_ACTIVITY: { icon: RefreshCw, color: "text-slate-500", label: "No Activity" },
}

export function NotificationBell({ notifications, unreadCount }: Props) {
  const [open, setOpen] = useState(false)

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellDot className="h-5 w-5 text-amber-600" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-lg border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAll}
                  className="h-7 text-xs gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => {
                  const config = typeConfig[notification.type] ?? {
                    icon: Bell,
                    color: "text-slate-500",
                    label: notification.type,
                  }
                  const Icon = config.icon
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${
                        !notification.is_read ? "bg-blue-50" : ""
                      }`}
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          {config.label}
                        </p>
                        <p className="text-sm leading-snug">{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="shrink-0 mt-0.5 text-muted-foreground hover:text-slate-900"
                          aria-label="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
