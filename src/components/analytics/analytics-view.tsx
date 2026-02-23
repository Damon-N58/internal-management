"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Ticket, Clock, Timer, CheckCircle, AlertTriangle, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

type ProfileData = { id: string; full_name: string; email: string; role: string }
type TicketData = {
  id: string; title: string; status: string; priority: number
  assigned_to: string | null; estimated_hours: number | null
  actual_hours: number | null; closed_at: string | null
  created_at: string; company_id: string
}
type AssignmentData = { user_id: string; company_id: string }

type Props = {
  profiles: ProfileData[]
  tickets: TicketData[]
  assignments: AssignmentData[]
}

type EmployeeStats = {
  profile: ProfileData
  totalTickets: number
  closedTickets: number
  openTickets: number
  blockedTickets: number
  totalEstimatedHours: number
  totalActualHours: number
  timeDelta: number
  avgCloseTimeHours: number
  assignedCompanies: number
  recentTickets: TicketData[]
}

function computeStats(profiles: ProfileData[], tickets: TicketData[], assignments: AssignmentData[]): EmployeeStats[] {
  return profiles.map((profile) => {
    const myTickets = tickets.filter((t) => t.assigned_to === profile.id)
    const closed = myTickets.filter((t) => t.status === "Closed")
    const open = myTickets.filter((t) => t.status === "Open" || t.status === "In Progress")
    const blocked = myTickets.filter((t) => t.status === "Blocked")

    const totalEstimated = myTickets.reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)
    const totalActual = closed.reduce((sum, t) => sum + (t.actual_hours ?? 0), 0)

    const assignedCompanies = assignments.filter((a) => a.user_id === profile.id).length

    return {
      profile,
      totalTickets: myTickets.length,
      closedTickets: closed.length,
      openTickets: open.length,
      blockedTickets: blocked.length,
      totalEstimatedHours: Math.round(totalEstimated * 10) / 10,
      totalActualHours: Math.round(totalActual * 10) / 10,
      timeDelta: Math.round((totalActual - totalEstimated) * 10) / 10,
      avgCloseTimeHours: closed.length > 0 ? Math.round((totalActual / closed.length) * 10) / 10 : 0,
      assignedCompanies,
      recentTickets: myTickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10),
    }
  }).sort((a, b) => b.closedTickets - a.closedTickets)
}

export function AnalyticsView({ profiles, tickets, assignments }: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeStats | null>(null)
  const stats = computeStats(profiles, tickets, assignments)

  const totalClosed = tickets.filter((t) => t.status === "Closed").length
  const totalOpen = tickets.filter((t) => t.status !== "Closed").length
  const totalEstimated = tickets.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
  const totalActual = tickets.filter((t) => t.status === "Closed").reduce((s, t) => s + (t.actual_hours ?? 0), 0)

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalClosed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open / Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalOpen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time (Est vs Actual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {Math.round(totalEstimated * 10) / 10}h → {Math.round(totalActual * 10) / 10}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((emp) => (
          <Card
            key={emp.profile.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedEmployee(emp)}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{emp.profile.full_name || emp.profile.email}</p>
                  <p className="text-xs text-muted-foreground">{emp.profile.role}</p>
                </div>
                <span className="text-xs bg-slate-100 rounded-full px-2 py-0.5">
                  {emp.assignedCompanies} client{emp.assignedCompanies !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="text-lg font-bold">{emp.closedTickets}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Closed</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <Ticket className="h-3.5 w-3.5" />
                    <span className="text-lg font-bold">{emp.openTickets}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Active</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="text-lg font-bold">{emp.blockedTickets}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Blocked</p>
                </div>
              </div>
              {emp.totalActualHours > 0 && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {emp.totalEstimatedHours}h est
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Timer className="h-3 w-3" /> {emp.totalActualHours}h actual
                  </span>
                  <span className={cn(
                    "font-medium flex items-center gap-1",
                    emp.timeDelta > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    {emp.timeDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {emp.timeDelta > 0 ? "+" : ""}{emp.timeDelta}h
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee Detail Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        {selectedEmployee && (
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedEmployee(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedEmployee.profile.full_name || selectedEmployee.profile.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{selectedEmployee.totalTickets}</p>
                  <p className="text-xs text-muted-foreground">Total Tickets</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedEmployee.closedTickets}</p>
                  <p className="text-xs text-muted-foreground">Closed</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{selectedEmployee.totalEstimatedHours}h</p>
                  <p className="text-xs text-muted-foreground">Estimated Hours</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{selectedEmployee.totalActualHours}h</p>
                  <p className="text-xs text-muted-foreground">Actual Hours</p>
                </div>
              </div>

              {selectedEmployee.totalActualHours > 0 && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium mb-2">Time Efficiency</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-3">
                      <div
                        className={cn(
                          "h-3 rounded-full",
                          selectedEmployee.timeDelta > 0 ? "bg-red-400" : "bg-green-400"
                        )}
                        style={{
                          width: `${Math.min(100, selectedEmployee.totalEstimatedHours > 0
                            ? (selectedEmployee.totalActualHours / selectedEmployee.totalEstimatedHours) * 100
                            : 100
                          )}%`
                        }}
                      />
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      selectedEmployee.timeDelta > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {selectedEmployee.timeDelta > 0 ? "+" : ""}{selectedEmployee.timeDelta}h
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedEmployee.timeDelta <= 0 ? "Under budget" : "Over budget"}
                    {selectedEmployee.avgCloseTimeHours > 0 && ` • Avg ${selectedEmployee.avgCloseTimeHours}h per ticket`}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Recent Tickets</p>
                <div className="space-y-1.5">
                  {selectedEmployee.recentTickets.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tickets assigned</p>
                  ) : (
                    selectedEmployee.recentTickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm truncate flex-1">{t.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {t.actual_hours != null && (
                            <span className="text-xs text-muted-foreground">{t.actual_hours}h</span>
                          )}
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            t.status === "Closed" ? "bg-green-100 text-green-700" :
                            t.status === "Blocked" ? "bg-red-100 text-red-700" :
                            t.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
