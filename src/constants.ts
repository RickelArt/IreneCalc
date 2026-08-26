import type { AbilityKey, FeatEntry, HitDieSize, PointBuyRules, SheetState } from './types'

export const ABILITIES: { key: AbilityKey; label: string }[] = [
  { key: 'str', label: 'Strength' },
  { key: 'dex', label: 'Dexterity' },
  { key: 'con', label: 'Constitution' },
  { key: 'int', label: 'Intelligence' },
  { key: 'wis', label: 'Wisdom' },
  { key: 'cha', label: 'Charisma' },
]

export const HIT_DIE_SIZES: HitDieSize[] = [4, 6, 8, 10, 12]

/** Extended 5e-style costs for scores 1–20 (image baseline 3–18, extended). */
export const DEFAULT_COSTS: Record<number, number> = {
  1: -16,
  2: -12,
  3: -9,
  4: -6,
  5: -4,
  6: -2,
  7: -1,
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
  16: 12,
  17: 15,
  18: 19,
  19: 24,
  20: 30,
}

export const DEFAULT_RULES: PointBuyRules = {
  availablePoints: 45,
  minScore: 4,
  maxScore: 18,
  costs: { ...DEFAULT_COSTS },
}

export const RAW_RULES: PointBuyRules = {
  availablePoints: 27,
  minScore: 8,
  maxScore: 15,
  costs: {
    ...DEFAULT_COSTS,
  },
}

export const OVERPAINT = {
  cePerPoint: 5,
  cePerFeat: 15,
  cePerHitDie: 5,
  cePerDieStep: 5,
  cePerProficiency: 5,
} as const

export function createFeat(partial?: Partial<FeatEntry>): FeatEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    hpBonus: 0,
    ceBonus: 0,
    editsStats: false,
    statBonuses: {},
    inCurrent: true,
    inNew: true,
    ...partial,
  }
}

export function defaultRacialBonuses(): Record<AbilityKey, number> {
  return { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }
}

export function createDefaultSheet(rules: PointBuyRules = DEFAULT_RULES): SheetState {
  const base = Math.max(rules.minScore, Math.min(8, rules.maxScore))
  return {
    scores: {
      str: base,
      dex: base,
      con: base,
      int: base,
      wis: base,
      cha: base,
    },
    racialBonuses: defaultRacialBonuses(),
    cursedEnergy: 0,
    flatHpBonus: 0,
    feats: [],
    hitDiceCount: 1,
    hitDiceSize: 8,
    proficiencies: 0,
  }
}

export function cloneSheet(sheet: SheetState): SheetState {
  return {
    ...sheet,
    scores: { ...sheet.scores },
    racialBonuses: { ...sheet.racialBonuses },
    feats: sheet.feats.map((feat) => ({
      ...feat,
      statBonuses: { ...feat.statBonuses },
    })),
  }
}

/** When locking, freeze Current ownership to match New. */
export function lockFeatOwnership(sheet: SheetState): SheetState {
  const next = cloneSheet(sheet)
  next.feats = next.feats.map((feat) => ({
    ...feat,
    inCurrent: feat.inNew,
  }))
  return next
}