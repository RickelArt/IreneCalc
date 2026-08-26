import type { SheetState } from '../types'
import { averageHitDieValue, computeHp, type HpBreakdown } from '../utils/hp'

interface Props {
  locked: SheetState | null
  draft: SheetState
}

export function HpPanel({ locked, draft }: Props) {
  const nextHp = computeHp(draft, 'inNew')
  const lockedHp = locked ? computeHp(locked, 'inCurrent') : null
  const delta = lockedHp ? nextHp.total - lockedHp.total : null

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Hit Points</h2>
          <p className="lede tight">
            First hit die is always maximum. Later dice use the median/average face (d
            {draft.hitDiceSize} → {averageHitDieValue(draft.hitDiceSize)}). CON mod applies per die.
            Feat HP bonuses stack on top.
          </p>
        </div>
      </div>

      <div className="hp-grid">
        {lockedHp && (
          <HpCard title="Locked HP" breakdown={lockedHp} tone="locked" />
        )}
        <HpCard title={locked ? 'New HP' : 'Current HP'} breakdown={nextHp} tone="live" />
      </div>

      {delta != null && (
        <p className="hp-delta">
          HP change:{' '}
          <strong className={delta === 0 ? '' : delta > 0 ? 'delta-down' : 'delta-up'}>
            {delta > 0 ? '+' : ''}
            {delta}
          </strong>
        </p>
      )}

      <p className="hint-box">
        Example: 1d8 with +2 CON → median line 5+2=<strong>7</strong>, but the first die is full so HP
        = 8+2=<strong>10</strong>. At 2 Hit Dice: 8 + 5 + 2×2 CON = <strong>17</strong>.
      </p>
    </section>
  )
}

function HpCard({
  title,
  breakdown,
  tone,
}: {
  title: string
  breakdown: HpBreakdown
  tone: 'locked' | 'live'
}) {
  return (
    <article className={`hp-card ${tone}`}>
      <h3>{title}</h3>
      <p className="hp-total">{breakdown.total}</p>
      <ul className="hp-parts">
        <li>
          <span>First die (full)</span>
          <strong>{breakdown.firstDieFull}</strong>
        </li>
        <li>
          <span>
            Remaining ({breakdown.remainingDice} × {breakdown.averagePerDie})
          </span>
          <strong>{breakdown.remainingTotal}</strong>
        </li>
        <li>
          <span>
            CON {breakdown.conMod >= 0 ? '+' : ''}
            {breakdown.conMod} × {breakdown.hitDiceCount} (score {breakdown.conScore})
          </span>
          <strong>{breakdown.conTotal}</strong>
        </li>
        <li>
          <span>Feat HP</span>
          <strong>
            {breakdown.featHp > 0 ? '+' : ''}
            {breakdown.featHp}
          </strong>
        </li>
      </ul>
      <p className="muted small">{breakdown.formula}</p>
    </article>
  )
}