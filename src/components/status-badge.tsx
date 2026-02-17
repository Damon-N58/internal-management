import { cn } from "@/lib/utils"

type Props = { status: string }

const statusColors: Record<string, string> = {
  POC: "bg-blue-100 text-blue-700 border-blue-200",
  Implementation: "bg-orange-100 text-orange-700 border-orange-200",
  Active: "bg-green-100 text-green-700 border-green-200",
  "Churn Risk": "bg-red-100 text-red-700 border-red-200",
  Open: "bg-blue-100 text-blue-700 border-blue-200",
  Blocked: "bg-red-100 text-red-700 border-red-200",
  Closed: "bg-slate-100 text-slate-600 border-slate-200",
  Requested: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Feature: "bg-purple-100 text-purple-700 border-purple-200",
  Issue: "bg-red-100 text-red-700 border-red-200",
  Email: "bg-sky-100 text-sky-700 border-sky-200",
  Note: "bg-slate-100 text-slate-600 border-slate-200",
  Automated: "bg-violet-100 text-violet-700 border-violet-200",
}

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] ?? "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {status}
    </span>
  )
}
