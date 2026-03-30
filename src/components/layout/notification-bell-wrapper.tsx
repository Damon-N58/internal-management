import { supabase } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"
import { NotificationBell } from "./notification-bell"
import type { Notification } from "@/types"

export async function NotificationBellWrapper() {
  let notifications: Notification[] = []
  let userId = ""

  try {
    const profile = await requireAuth()
    userId = profile.id

    const { data } = await supabase
      .from("notification")
      .select()
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("is_read", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(30)

    notifications = data ?? []
  } catch {
    // DB unavailable — render empty bell
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return <NotificationBell notifications={notifications} unreadCount={unreadCount} userId={userId} />
}
