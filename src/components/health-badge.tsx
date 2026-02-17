import { cn } from "@/lib/utils"

type Props = { score: number }

export function HealthBadge({ score }: Props) {
  const color =
    score <= 2
      ? "bg-red-100 text-red-700 border-red-200"
      : score <= 4
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-green-100 text-green-700 border-green-200"

  const label = score <= 2 ? "At Risk" : score <= 4 ? "Moderate" : "Healthy"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        color
      )}
    >
      {score} — {label}
    </span>
  )
}
