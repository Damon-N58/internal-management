"use client"

import { useState, useCallback } from "react"
import { Trophy, Flame, Clock, CheckSquare, TrendingUp, X } from "lucide-react"
import { cn } from "@/lib/utils"

type EmployeeScore = {
  id: string
  name: string
  ticketsClosed: number
  hoursLogged: number
  efficiencyScore: number
  streak: number
}

function getTotalScore(e: EmployeeScore) {
  return e.ticketsClosed * 10 + Math.round(e.efficiencyScore * 5) + e.streak * 3
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-pink-500",
]

const rankBadges = ["1st", "2nd", "3rd"]
const rankColors = [
  "text-amber-500 border-amber-300 bg-amber-50",
  "text-slate-500 border-slate-300 bg-slate-50",
  "text-orange-400 border-orange-200 bg-orange-50",
]

export function LeaderboardButton() {
  const [open, setOpen] = useState(false)
  const [employees, setEmployees] = useState<EmployeeScore[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAndOpen = useCallback(async () => {
    setOpen(true)
    if (employees.length > 0) return
    setLoading(true)
    try {
      const res = await fetch("/api/leaderboard")
      const data = await res.json()
      setEmployees(data)
    } finally {
      setLoading(false)
    }
  }, [employees.length])

  const ranked = [...employees]
    .map((e) => ({ ...e, totalScore: getTotalScore(e) }))
    .sort((a, b) => b.totalScore - a.totalScore)

  const topScore = ranked[0]?.totalScore || 1

  return (
    <>
      <button
        onClick={fetchAndOpen}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
      >
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        Rankings
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-slate-800">Team Rankings</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                  Loading...
                </div>
              ) : ranked.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No data yet — close some tickets first.
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {ranked.map((emp, i) => {
                    const barWidth = Math.max(6, (emp.totalScore / topScore) * 100)
                    const initials = getInitials(emp.name)
                    const avatarColor = avatarColors[i % avatarColors.length]
                    const isTop3 = i < 3

                    return (
                      <div
                        key={emp.id}
                        className={cn(
                          "px-4 py-3 transition-colors hover:bg-slate-50/80",
                          i === 0 && "bg-amber-50/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0", avatarColor)}>
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm font-medium text-slate-800 truncate">{emp.name}</span>
                                {isTop3 && (
                                  <span className={cn("shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", rankColors[i])}>
                                    {rankBadges[i]}
                                  </span>
                                )}
                                {!isTop3 && (
                                  <span className="shrink-0 text-[10px] text-slate-400">#{i + 1}</span>
                                )}
                              </div>
                              <span className="shrink-0 text-sm font-bold text-slate-700 tabular-nums ml-2">
                                {emp.totalScore}
                                <span className="text-[10px] font-normal text-slate-400 ml-0.5">pts</span>
                              </span>
                            </div>

                            {/* Score bar */}
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-300" : "bg-slate-300"
                                )}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <CheckSquare className="h-3 w-3 text-emerald-400" />
                                {emp.ticketsClosed}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blue-400" />
                                {emp.hoursLogged}h
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-violet-400" />
                                {emp.efficiencyScore}%
                              </span>
                              {emp.streak > 0 && (
                                <span className="flex items-center gap-1 text-orange-400 font-medium">
                                  <Flame className="h-3 w-3" />
                                  {emp.streak}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2.5">
              <p className="text-[10px] text-slate-400">
                pts = closed×10 + efficiency×5 + streak×3
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
