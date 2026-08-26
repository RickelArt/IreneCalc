import { ABILITIES } from '../constants'
import type { AbilityKey, PointBuyRules, SheetState } from '../types'
import { effectiveScore, racialBonus, sumFeatStatBonus } from '../utils/hp'
import { abilityModifier, clampScore, formatModifier, scoreCost } from '../utils/pointBuy'

interface Props {
  locked: SheetState | null
  draft: SheetState
  rules: PointBuyRules
  onChangeScore: (key: AbilityKey, value: number) => void
  onChangeRacialBonus: (key: AbilityKey, value: number) => void
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`
  return `${value}`
}

export function AttributeTable({
  locked,
  draft,
  rules,
  onChangeScore,
  onChangeRacialBonus,
}: Props) {
  const active = 'inNew' as const

  return (
    <div className="table-wrap">
      <table className="attr-table">
        <thead>
          <tr>
            <th>Attribute</th>
            {locked && <th className="locked-col">Locked Base</th>}
            <th>Point-Buy Base</th>
            {locked && <th className="locked-col">Locked Race</th>}
            <th>Race</th>
            {locked && <th>Δ Race</th>}
            <th>Feat Δ</th>
            <th>Total</th>
            <th>Modifier</th>
            <th>Point Cost</th>
            {locked && <th>Δ Cost</th>}
          </tr>
        </thead>
        <tbody>
          {ABILITIES.map(({ key, label }) => {
            const base = draft.scores[key]
            const race = racialBonus(draft, key)
            const featDelta = sumFeatStatBonus(draft.feats, key, active)
            const total = effectiveScore(draft, key, active)
            const mod = abilityModifier(total)
            const cost = scoreCost(base, rules)
            const lockedBase = locked?.scores[key]
            const lockedRace = locked ? racialBonus(locked, key) : null
            const raceDelta = lockedRace != null ? race - lockedRace : null
            const lockedCost = lockedBase != null ? scoreCost(lockedBase, rules) : null
            const costDelta = lockedCost != null ? cost - lockedCost : null

            return (
              <tr key={key}>
                <td className="attr-name">{label}</td>
                {locked && (
                  <td className="locked-col">
                    <span className="locked-pill">{lockedBase}</span>
                  </td>
                )}
                <td>
                  <input
                    className="num-input"
                    type="number"
                    min={rules.minScore}
                    max={rules.maxScore}
                    value={base}
                    title="Point-buy base only — race and feat bonuses are separate"
                    onChange={(e) =>
                      onChangeScore(key, clampScore(Number(e.target.value) || rules.minScore, rules))
                    }
                  />
                </td>
                {locked && (
                  <td className="locked-col">
                    <span className="locked-pill">{formatSigned(lockedRace ?? 0)}</span>
                  </td>
                )}
                <td>
                  <input
                    className="num-input compact"
                    type="number"
                    value={race}
                    title="Racial bonus — outside the point-buy pool"
                    onChange={(e) => onChangeRacialBonus(key, Number(e.target.value) || 0)}
                  />
                </td>
                {locked && (
                  <td
                    className={`mono ${
                      raceDelta && raceDelta !== 0
                        ? raceDelta > 0
                          ? 'delta-down'
                          : 'delta-up'
                        : 'delta-flat'
                    }`}
                  >
                    {raceDelta == null ? '—' : formatSigned(raceDelta)}
                  </td>
                )}
                <td
                  className={`mono ${
                    featDelta ? (featDelta > 0 ? 'delta-down' : 'delta-up') : 'delta-flat'
                  }`}
                >
                  {formatSigned(featDelta)}
                </td>
                <td className="mono">
                  <strong>{total}</strong>
                </td>
                <td className="mono">{formatModifier(mod)}</td>
                <td className="mono">{cost}</td>
                {locked && (
                  <td
                    className={`mono ${
                      costDelta && costDelta !== 0
                        ? costDelta > 0
                          ? 'delta-up'
                          : 'delta-down'
                        : ''
                    }`}
                  >
                    {costDelta == null ? '—' : formatSigned(costDelta)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="table-note">
        Point cost uses the point-buy base only. Race and feat bonuses apply on top and never enter
        the point-buy pool. After locking, Δ Race updates automatically from Locked Race → Race.
      </p>
    </div>
  )
}
