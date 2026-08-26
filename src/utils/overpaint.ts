import { HIT_DIE_SIZES, OVERPAINT } from '../constants'
import type { HitDieSize, PointBuyRules, SheetState } from '../types'
import {
  activeFeatCount,
  currentFeatCeBonus,
  keptCurrentFeatCeBonus,
  lostFeatCeBonus,
} from './hp'
import { totalPointCost } from './pointBuy'

export interface OverpaintBreakdown {
  pointDelta: number
  featDelta: number
  hitDieCountDelta: number
  hitDieStepDelta: number
  proficiencyDelta: number
  ceFromPoints: number
  ceFromFeats: number
  ceFromHitDice: number
  ceFromDieSize: number
  ceFromProficiencies: number
  /** CE from Current feats before Overpaint */
  featCeBefore: number
  /** CE from Current feats still kept on New */
  featCeKept: number
  /** CE lost by sacrificing Current feats */
  lostFeatCe: number
  /** Positive = CE spent to reach New from Locked (Overpaint trades only) */
  totalCeCost: number
  /** Locked base CE minus Overpaint trade cost (excludes feat CE bonuses) */
  projectedCe: number
  /** Usable CE before: base + Current feat CE bonuses */
  usableCeBefore: number
  /** Usable CE after: projected base + kept Current feat CE */
  usableCeAfter: number
  ceBalance: number
}

export function dieSizeIndex(size: HitDieSize): number {
  return HIT_DIE_SIZES.indexOf(size)
}

export function computeOverpaintCost(
  locked: SheetState,
  next: SheetState,
  rules: PointBuyRules,
): OverpaintBreakdown {
  const pointDelta = totalPointCost(next.scores, rules) - totalPointCost(locked.scores, rules)
  const featDelta = activeFeatCount(next.feats, 'inNew') - activeFeatCount(locked.feats, 'inCurrent')
  const hitDieCountDelta = next.hitDiceCount - locked.hitDiceCount
  const hitDieStepDelta = dieSizeIndex(next.hitDiceSize) - dieSizeIndex(locked.hitDiceSize)
  const proficiencyDelta = next.proficiencies - locked.proficiencies

  const ceFromPoints = pointDelta * OVERPAINT.cePerPoint
  const ceFromFeats = featDelta * OVERPAINT.cePerFeat
  const ceFromHitDice = hitDieCountDelta * OVERPAINT.cePerHitDie
  const ceFromDieSize = Math.abs(hitDieStepDelta) * OVERPAINT.cePerDieStep
  const ceFromProficiencies = proficiencyDelta * OVERPAINT.cePerProficiency

  const totalCeCost =
    ceFromPoints + ceFromFeats + ceFromHitDice + ceFromDieSize + ceFromProficiencies

  const featCeBefore = currentFeatCeBonus(locked.feats)
  const featCeKept = keptCurrentFeatCeBonus(next.feats)
  const lostFeatCe = lostFeatCeBonus(next.feats)

  const projectedCe = locked.cursedEnergy - totalCeCost
  const usableCeBefore = locked.cursedEnergy + featCeBefore
  const usableCeAfter = projectedCe + featCeKept
  const ceBalance = next.cursedEnergy - projectedCe

  return {
    pointDelta,
    featDelta,
    hitDieCountDelta,
    hitDieStepDelta,
    proficiencyDelta,
    ceFromPoints,
    ceFromFeats,
    ceFromHitDice,
    ceFromDieSize,
    ceFromProficiencies,
    featCeBefore,
    featCeKept,
    lostFeatCe,
    totalCeCost,
    projectedCe,
    usableCeBefore,
    usableCeAfter,
    ceBalance,
  }
}

export function formatCe(value: number): string {
  if (value > 0) return `+${value} CE`
  if (value < 0) return `${value} CE`
  return '0 CE'
}

export function formatSpend(value: number): string {
  if (value > 0) return `Spend ${value} CE`
  if (value < 0) return `Gain ${Math.abs(value)} CE`
  return 'No CE change'
}
