export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type HitDieSize = 4 | 6 | 8 | 10 | 12

export interface FeatEntry {
  id: string
  name: string
  /** Flat HP this feat adds (e.g. Tough). Separate from hit dice / CON. */
  hpBonus: number
  /**
   * CE granted while this is a Current feat. Lost from usable CE if the feat is sacrificed
   * (Current but not New). New-only feats do not grant this.
   */
  ceBonus: number
  /** When true, this feat changes ability scores outside the point-buy pool. */
  editsStats: boolean
  /** Applied on top of point-buy scores when the feat is active. */
  statBonuses: Partial<Record<AbilityKey, number>>
  /** Owned on the Locked / current sheet */
  inCurrent: boolean
  /** Owned on the New / edited sheet */
  inNew: boolean
}

export interface SheetState {
  scores: Record<AbilityKey, number>
  /** Racial ability bonuses — outside the point-buy pool. Default +1 all. */
  racialBonuses: Record<AbilityKey, number>
  cursedEnergy: number
  /**
   * Flat HP bonus/penalty that stays the same through Overpaint (e.g. +5 or -5).
   * Applied to both before and after HP.
   */
  flatHpBonus: number
  feats: FeatEntry[]
  hitDiceCount: number
  hitDiceSize: HitDieSize
  proficiencies: number
}

export interface PointBuyRules {
  availablePoints: number
  minScore: number
  maxScore: number
  /** Point cost to purchase each score from 1–20 */
  costs: Record<number, number>
}

export type TabId = 'calculator' | 'compare' | 'custom' | 'overpaint'