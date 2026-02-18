import { prisma } from "@/lib/prisma"
import { NotificationBell } from "./notification-bell"

export async function NotificationBellWrapper() {
  const notifications = await prisma.notification.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 20,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return <NotificationBell notifications={notifications} unreadCount={unreadCount} />
}
