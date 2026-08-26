import { ABILITIES } from '../constants'
import type { PointBuyRules, SheetState } from '../types'
import {
  activeFeatCount,
  computeHp,
  effectiveScore,
  racialBonus,
  sumFeatStatBonus,
} from '../utils/hp'
import { formatSpend, type OverpaintBreakdown } from '../utils/overpaint'
import { abilityModifier, formatModifier, totalPointCost } from '../utils/pointBuy'

interface Props {
  locked: SheetState | null
  draft: SheetState
  rules: PointBuyRules
  breakdown: OverpaintBreakdown | null
}

function signed(value: number): string {
  if (value > 0) return `+${value}`
  return `${value}`
}

function DeltaCell({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="delta-flat">0{suffix}</span>
  return (
    <span className={value > 0 ? 'delta-down' : 'delta-up'}>
      {signed(value)}
      {suffix}
    </span>
  )
}

export function BeforeAfterPanel({ locked, draft, rules, breakdown }: Props) {
  if (!locked) {
    return (
      <section className="panel">
        <h2>Before vs After</h2>
        <p className="hint-box">
          Lock Current on the Calculator tab first. This view then shows every Locked → New change in
          one place.
        </p>
      </section>
    )
  }

  const beforePoints = totalPointCost(locked.scores, rules)
  const afterPoints = totalPointCost(draft.scores, rules)
  const beforeHp = computeHp(locked, 'inCurrent')
  const afterHp = computeHp(draft, 'inNew')
  const beforeFeats = activeFeatCount(locked.feats, 'inCurrent')
  const afterFeats = activeFeatCount(draft.feats, 'inNew')

  const featRows = (() => {
    const byId = new Map<string, { id: string; name: string; before: boolean; after: boolean }>()
    for (const feat of locked.feats) {
      byId.set(feat.id, {
        id: feat.id,
        name: feat.name || 'Unnamed feat',
        before: feat.inCurrent,
        after: false,
      })
    }
    for (const feat of draft.feats) {
      const existing = byId.get(feat.id)
      if (existing) {
        existing.after = feat.inNew
        existing.name = feat.name || existing.name
      } else {
        byId.set(feat.id, {
          id: feat.id,
          name: feat.name || 'Unnamed feat',
          before: false,
          after: feat.inNew,
        })
      }
    }
    return [...byId.values()].filter((row) => row.before || row.after)
  })()

  return (
    <section className="panel compare-panel">
      <div className="panel-head">
        <div>
          <h2>Before vs After</h2>
          <p className="lede tight">Quick scan of every Locked → New change from Overpaint.</p>
        </div>
        {breakdown && (
          <div className="compare-ce">
            <strong>{formatSpend(breakdown.totalCeCost)}</strong>
            <span className="muted">
              CE {locked.cursedEnergy} → {breakdown.projectedCe}
            </span>
          </div>
        )}
      </div>

      <div className="table-wrap">
        <table className="attr-table compare-table">
          <thead>
            <tr>
              <th>Ability</th>
              <th>Before</th>
              <th>After</th>
              <th>Δ Total</th>
              <th>Base</th>
              <th>Race</th>
              <th>Feat</th>
            </tr>
          </thead>
          <tbody>
            {ABILITIES.map(({ key, label }) => {
              const beforeTotal = effectiveScore(locked, key, 'inCurrent')
              const afterTotal = effectiveScore(draft, key, 'inNew')
              const baseDelta = draft.scores[key] - locked.scores[key]
              const raceDelta = racialBonus(draft, key) - racialBonus(locked, key)
              const featDelta =
                sumFeatStatBonus(draft.feats, key, 'inNew') -
                sumFeatStatBonus(locked.feats, key, 'inCurrent')

              return (
                <tr key={key} className={afterTotal !== beforeTotal ? 'row-changed' : undefined}>
                  <td className="attr-name">{label}</td>
                  <td className="mono">
                    {beforeTotal}{' '}
                    <span className="muted">({formatModifier(abilityModifier(beforeTotal))})</span>
                  </td>
                  <td className="mono">
                    {afterTotal}{' '}
                    <span className="muted">({formatModifier(abilityModifier(afterTotal))})</span>
                  </td>
                  <td className="mono">
                    <DeltaCell value={afterTotal - beforeTotal} />
                  </td>
                  <td className="mono">
                    <DeltaCell value={baseDelta} />
                  </td>
                  <td className="mono">
                    <DeltaCell value={raceDelta} />
                  </td>
                  <td className="mono">
                    <DeltaCell value={featDelta} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="compare-grid">
        <article className="compare-card">
          <h3>Resources</h3>
          <ul className="compare-list">
            <li>
              <span>Point buy spent</span>
              <span>
                {beforePoints} → {afterPoints} <DeltaCell value={afterPoints - beforePoints} />
              </span>
            </li>
            <li>
              <span>Cursed Energy</span>
              <span>
                {locked.cursedEnergy} → {draft.cursedEnergy}{' '}
                <DeltaCell value={draft.cursedEnergy - locked.cursedEnergy} />
              </span>
            </li>
            <li>
              <span>Hit dice</span>
              <span>
                {locked.hitDiceCount}d{locked.hitDiceSize} → {draft.hitDiceCount}d{draft.hitDiceSize}
              </span>
            </li>
            <li>
              <span>Proficiencies</span>
              <span>
                {locked.proficiencies} → {draft.proficiencies}{' '}
                <DeltaCell value={draft.proficiencies - locked.proficiencies} />
              </span>
            </li>
            <li>
              <span>Active feats</span>
              <span>
                {beforeFeats} → {afterFeats} <DeltaCell value={afterFeats - beforeFeats} />
              </span>
            </li>
          </ul>
        </article>

        <article className="compare-card">
          <h3>Hit Points</h3>
          <p className="hp-total compare-hp">
            {beforeHp.total} → {afterHp.total}
          </p>
          <p className="muted">
            Δ HP <DeltaCell value={afterHp.total - beforeHp.total} />
          </p>
          <ul className="compare-list">
            <li>
              <span>Before</span>
              <span className="muted">{beforeHp.formula}</span>
            </li>
            <li>
              <span>After</span>
              <span className="muted">{afterHp.formula}</span>
            </li>
          </ul>
        </article>

        <article className="compare-card">
          <h3>Feats</h3>
          {featRows.length === 0 ? (
            <p className="muted">No feats on either sheet.</p>
          ) : (
            <ul className="compare-list">
              {featRows.map((feat) => {
                let status = 'Kept'
                if (feat.before && !feat.after) status = 'Removed'
                if (!feat.before && feat.after) status = 'Added'
                if (!feat.before && !feat.after) status = 'Unused'
                return (
                  <li key={feat.id}>
                    <span>{feat.name}</span>
                    <strong
                      className={
                        status === 'Added'
                          ? 'delta-down'
                          : status === 'Removed'
                            ? 'delta-up'
                            : 'muted'
                      }
                    >
                      {status}
                    </strong>
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        {breakdown && (
          <article className="compare-card">
            <h3>CE Cost Breakdown</h3>
            <ul className="compare-list">
              <li>
                <span>Points</span>
                <DeltaCell value={breakdown.ceFromPoints} suffix=" CE" />
              </li>
              <li>
                <span>Feats</span>
                <DeltaCell value={breakdown.ceFromFeats} suffix=" CE" />
              </li>
              <li>
                <span>Hit dice count</span>
                <DeltaCell value={breakdown.ceFromHitDice} suffix=" CE" />
              </li>
              <li>
                <span>Hit die size</span>
                <DeltaCell value={breakdown.ceFromDieSize} suffix=" CE" />
              </li>
              <li>
                <span>Proficiencies</span>
                <DeltaCell value={breakdown.ceFromProficiencies} suffix=" CE" />
              </li>
              <li>
                <span>Total</span>
                <strong>{formatSpend(breakdown.totalCeCost)}</strong>
              </li>
            </ul>
          </article>
        )}
      </div>
    </section>
  )
}
