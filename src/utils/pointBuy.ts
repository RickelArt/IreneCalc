import type { AbilityKey, PointBuyRules, SheetState } from '../types'

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function scoreCost(score: number, rules: PointBuyRules): number {
  return rules.costs[score] ?? 0
}

export function totalPointCost(scores: Record<AbilityKey, number>, rules: PointBuyRules): number {
  return (Object.keys(scores) as AbilityKey[]).reduce(
    (sum, key) => sum + scoreCost(scores[key], rules),
    0,
  )
}

export function clampScore(value: number, rules: PointBuyRules): number {
  return Math.min(rules.maxScore, Math.max(rules.minScore, value))
}

export function pointsRemaining(sheet: SheetState, rules: PointBuyRules): number {
  return rules.availablePoints - totalPointCost(sheet.scores, rules)
}