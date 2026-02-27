export type HealthScoreInput = {
  openBlockerCount: number
  daysSinceLastActivity: number | null
  openPCRCount: number
  conversationVolume: number | null
  daysUntilContractExpiry: number | null
}

export type HealthScoreBreakdown = {
  blockerScore: number
  activityScore: number
  pcrScore: number
  usageScore: number | null
  expiryScore: number
}

export type HealthScoreResult = {
  score: number
  breakdown: HealthScoreBreakdown
}

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const { openBlockerCount, daysSinceLastActivity, openPCRCount, conversationVolume, daysUntilContractExpiry } = input

  const blockerScore = Math.max(1, 5 - openBlockerCount)

  const activityScore =
    daysSinceLastActivity === null
      ? 1
      : daysSinceLastActivity <= 7
      ? 5
      : daysSinceLastActivity <= 30
      ? 3
      : 1

  const pcrScore = Math.max(1, 5 - openPCRCount * 0.5)

  const usageScore =
    conversationVolume === null
      ? null
      : conversationVolume === 0
      ? 1
      : conversationVolume < 10
      ? 2
      : conversationVolume < 50
      ? 3
      : conversationVolume < 200
      ? 4
      : 5

  const expiryScore =
    daysUntilContractExpiry === null
      ? 5
      : daysUntilContractExpiry > 60
      ? 5
      : daysUntilContractExpiry > 30
      ? 3
      : 1

  const scores = [blockerScore, activityScore, pcrScore, expiryScore]
  if (usageScore !== null) scores.push(usageScore)

  const average = scores.reduce((a, b) => a + b, 0) / scores.length
  const score = Math.min(5, Math.max(1, Math.round(average)))

  return {
    score,
    breakdown: { blockerScore, activityScore, pcrScore, usageScore, expiryScore },
  }
}
