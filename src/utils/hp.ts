import type { AbilityKey, FeatEntry, HitDieSize, SheetState } from '../types'
import { abilityModifier } from './pointBuy'

/** 5e-style average / median face for a die (d8 → 5). */
export function averageHitDieValue(size: HitDieSize): number {
  return Math.floor(size / 2) + 1
}

export function sumFeatStatBonus(
  feats: SheetState['feats'],
  ability: AbilityKey,
  active: 'inCurrent' | 'inNew',
): number {
  return feats.reduce((sum, feat) => {
    if (!feat[active] || !feat.editsStats) return sum
    return sum + (feat.statBonuses[ability] ?? 0)
  }, 0)
}

export function racialBonus(sheet: SheetState, ability: AbilityKey): number {
  return sheet.racialBonuses?.[ability] ?? 0
}

export function effectiveScore(
  sheet: SheetState,
  ability: AbilityKey,
  active: 'inCurrent' | 'inNew',
): number {
  return (
    sheet.scores[ability] +
    racialBonus(sheet, ability) +
    sumFeatStatBonus(sheet.feats, ability, active)
  )
}

export function totalFeatHpBonus(feats: SheetState['feats'], active: 'inCurrent' | 'inNew'): number {
  return feats.reduce((sum, feat) => (feat[active] ? sum + feat.hpBonus : sum), 0)
}

export function activeFeatCount(feats: SheetState['feats'], active: 'inCurrent' | 'inNew'): number {
  return feats.filter((feat) => feat[active]).length
}

/** CE granted by Current feats only. */
export function currentFeatCeBonus(feats: FeatEntry[]): number {
  return feats.reduce((sum, feat) => (feat.inCurrent ? sum + (feat.ceBonus ?? 0) : sum), 0)
}

/** CE from Current feats that are kept on New. */
export function keptCurrentFeatCeBonus(feats: FeatEntry[]): number {
  return feats.reduce(
    (sum, feat) => (feat.inCurrent && feat.inNew ? sum + (feat.ceBonus ?? 0) : sum),
    0,
  )
}

/** CE lost when Current feats are sacrificed (not on New). */
export function lostFeatCeBonus(feats: FeatEntry[]): number {
  return feats.reduce(
    (sum, feat) => (feat.inCurrent && !feat.inNew ? sum + (feat.ceBonus ?? 0) : sum),
    0,
  )
}

export function usableCursedEnergy(baseCe: number, feats: FeatEntry[], mode: 'before' | 'after'): number {
  if (mode === 'before') return baseCe + currentFeatCeBonus(feats)
  return baseCe + keptCurrentFeatCeBonus(feats)
}

export interface HpBreakdown {
  hitDiceCount: number
  hitDiceSize: HitDieSize
  firstDieFull: number
  remainingDice: number
  averagePerDie: number
  remainingTotal: number
  conScore: number
  conMod: number
  conTotal: number
  featHp: number
  flatHpBonus: number
  total: number
  formula: string
}

/**
 * HP uses:
 * - first hit die at maximum face
 * - each later die at average/median (d8 → 5, so 1d8+2 median line = 7)
 * - CON mod × hit dice count
 * - flat HP from active feats
 * - persistent flat HP bonus (same before and after when passed explicitly)
 */
export function computeHp(
  sheet: SheetState,
  active: 'inCurrent' | 'inNew',
  flatHpBonus: number = sheet.flatHpBonus ?? 0,
): HpBreakdown {
  const count = Math.max(0, sheet.hitDiceCount)
  const size = sheet.hitDiceSize
  const averagePerDie = averageHitDieValue(size)
  const conScore = effectiveScore(sheet, 'con', active)
  const conMod = abilityModifier(conScore)
  const featHp = totalFeatHpBonus(sheet.feats, active)

  if (count === 0) {
    const total = featHp + flatHpBonus
    return {
      hitDiceCount: 0,
      hitDiceSize: size,
      firstDieFull: 0,
      remainingDice: 0,
      averagePerDie,
      remainingTotal: 0,
      conScore,
      conMod,
      conTotal: 0,
      featHp,
      flatHpBonus,
      total,
      formula: [
        featHp ? `feats ${featHp >= 0 ? '+' : ''}${featHp}` : null,
        flatHpBonus ? `flat ${flatHpBonus >= 0 ? '+' : ''}${flatHpBonus}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || '0',
    }
  }

  const firstDieFull = size
  const remainingDice = count - 1
  const remainingTotal = remainingDice * averagePerDie
  const conTotal = count * conMod
  const total = firstDieFull + remainingTotal + conTotal + featHp + flatHpBonus

  const parts = [
    `${count}d${size}`,
    `first ${firstDieFull}`,
    remainingDice > 0 ? `+ ${remainingDice}×${averagePerDie}` : null,
    `${conMod >= 0 ? '+' : ''}${conMod}×${count} CON`,
    featHp ? `${featHp >= 0 ? '+' : ''}${featHp} feats` : null,
    flatHpBonus ? `${flatHpBonus >= 0 ? '+' : ''}${flatHpBonus} flat` : null,
  ].filter(Boolean)

  return {
    hitDiceCount: count,
    hitDiceSize: size,
    firstDieFull,
    remainingDice,
    averagePerDie,
    remainingTotal,
    conScore,
    conMod,
    conTotal,
    featHp,
    flatHpBonus,
    total,
    formula: parts.join(' · '),
  }
}
