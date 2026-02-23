"use client"

import { useState } from "react"
import { Trophy, Flame, Zap, Target, Medal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type EmployeeScore = {
  id: string
  name: string
  ticketsClosed: number
  hoursLogged: number
  efficiencyScore: number
  streak: number
}

type Props = {
  employees: EmployeeScore[]
}

const medals = ["🥇", "🥈", "🥉"]
const rankTitles = [
  "Ticket Terminator",
  "Sprint Champion",
  "Bug Buster",
  "Code Crusader",
  "Task Tactician",
]

function getTotalScore(e: EmployeeScore) {
  return e.ticketsClosed * 10 + Math.round(e.efficiencyScore * 5) + e.streak * 3
}

export function LeaderboardButton({ employees }: Props) {
  const [open, setOpen] = useState(false)

  const ranked = [...employees]
    .map((e) => ({ ...e, totalScore: getTotalScore(e) }))
    .sort((a, b) => b.totalScore - a.totalScore)

  const topScore = ranked[0]?.totalScore || 1

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:shadow-md transition-shadow"
      >
        <Trophy className="h-3.5 w-3.5" />
        Leaderboard
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              Team Leaderboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {ranked.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet — close some tickets!</p>
            ) : (
              ranked.map((emp, i) => {
                const barWidth = Math.max(8, (emp.totalScore / topScore) * 100)
                return (
                  <div
                    key={emp.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      i === 0 && "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm",
                      i === 1 && "bg-slate-50 border-slate-200",
                      i === 2 && "bg-orange-50/30 border-orange-100",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl w-8 text-center shrink-0">
                        {i < 3 ? medals[i] : <span className="text-sm font-bold text-slate-400">#{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{emp.name}</p>
                            <p className="text-[10px] text-muted-foreground italic">
                              {rankTitles[i % rankTitles.length]}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                              {emp.totalScore}
                            </p>
                            <p className="text-[10px] text-muted-foreground">pts</p>
                          </div>
                        </div>
                        <div className="mt-2 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-green-500" />
                            {emp.ticketsClosed} closed
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-blue-500" />
                            {emp.hoursLogged}h logged
                          </span>
                          <span className="flex items-center gap-1">
                            <Medal className="h-3 w-3 text-purple-500" />
                            {Math.round(emp.efficiencyScore)}% eff
                          </span>
                          {emp.streak > 0 && (
                            <span className="flex items-center gap-1 text-orange-500 font-medium">
                              <Flame className="h-3 w-3" />
                              {emp.streak} streak
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            <div className="border-t pt-3 mt-3">
              <p className="text-[10px] text-muted-foreground text-center">
                Score = (Tickets Closed × 10) + (Efficiency % × 5) + (Streak × 3)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
