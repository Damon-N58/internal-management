import { supabase } from "@/lib/supabase"
import { NotificationBell } from "./notification-bell"
import type { Notification } from "@/types"

export async function NotificationBellWrapper() {
  let notifications: Notification[] = []
  try {
    const { data } = await supabase
      .from("notification")
      .select()
      .order("is_read", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(20)

    notifications = data ?? []
  } catch {
    // DB unavailable — render empty bell
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return <NotificationBell notifications={notifications} unreadCount={unreadCount} />
}
