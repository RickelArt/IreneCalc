import { HIT_DIE_SIZES, OVERPAINT } from '../constants'
import type { HitDieSize, SheetState } from '../types'
import type { OverpaintBreakdown } from '../utils/overpaint'
import { formatSpend } from '../utils/overpaint'
import { activeFeatCount } from '../utils/hp'

interface Props {
  locked: SheetState | null
  draft: SheetState
  breakdown: OverpaintBreakdown | null
  onChange: <K extends keyof SheetState>(key: K, value: SheetState[K]) => void
  onLock: () => void
  onUnlock: () => void
  onResetDraft: () => void
  onApplyProjectedCe: () => void
}

function Delta({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="delta-flat">0{suffix}</span>
  const cls = value > 0 ? 'delta-up' : 'delta-down'
  return (
    <span className={cls}>
      {value > 0 ? '+' : ''}
      {value}
      {suffix}
    </span>
  )
}

export function OverpaintResources({
  locked,
  draft,
  breakdown,
  onChange,
  onLock,
  onUnlock,
  onResetDraft,
  onApplyProjectedCe,
}: Props) {
  const featCurrent = activeFeatCount(draft.feats, 'inCurrent')
  const featNew = activeFeatCount(draft.feats, 'inNew')

  return (
    <section className="panel resources-panel">
      <div className="panel-head">
        <div>
          <h2>Overpaint Resources</h2>
          <p className="lede tight">
            Lock your current sheet, then edit New values. Feat ownership is managed in the Feats panel
            (separate from point buy).
          </p>
        </div>
        <div className="btn-row">
          {!locked ? (
            <button type="button" className="btn primary" onClick={onLock}>
              Lock Current
            </button>
          ) : (
            <>
              <button type="button" className="btn ghost" onClick={onUnlock}>
                Unlock
              </button>
              <button type="button" className="btn ghost" onClick={onResetDraft}>
                Reset New to Locked
              </button>
            </>
          )}
        </div>
      </div>

      <div className="resource-grid">
        <ResourceRow
          label="Cursed Energy"
          locked={locked?.cursedEnergy}
          value={draft.cursedEnergy}
          min={0}
          onChange={(v) => onChange('cursedEnergy', v)}
        />
        <div className="resource-row">
          <span className="resource-label">
            Cursed Feats
            <small>
              {OVERPAINT.cePerFeat} CE each · managed below · Current {featCurrent} / New {featNew}
            </small>
          </span>
          <div className="resource-values">
            {locked && <span className="locked-pill">{activeFeatCount(locked.feats, 'inCurrent')}</span>}
            <span className="mono">{featNew}</span>
          </div>
        </div>
        <ResourceRow
          label="Hit Dice Count"
          locked={locked?.hitDiceCount}
          value={draft.hitDiceCount}
          min={0}
          onChange={(v) => onChange('hitDiceCount', v)}
          hint={`${OVERPAINT.cePerHitDie} CE each`}
        />
        <label className="resource-row">
          <span className="resource-label">
            Hit Dice Size
            <small>{OVERPAINT.cePerDieStep} CE per step</small>
          </span>
          <div className="resource-values">
            {locked && <span className="locked-pill">d{locked.hitDiceSize}</span>}
            <select
              className="select-input"
              value={draft.hitDiceSize}
              onChange={(e) => onChange('hitDiceSize', Number(e.target.value) as HitDieSize)}
            >
              {HIT_DIE_SIZES.map((size) => (
                <option key={size} value={size}>
                  d{size}
                </option>
              ))}
            </select>
          </div>
        </label>
        <ResourceRow
          label="Proficiencies"
          locked={locked?.proficiencies}
          value={draft.proficiencies}
          min={0}
          onChange={(v) => onChange('proficiencies', v)}
          hint={`${OVERPAINT.cePerProficiency} CE each`}
        />
      </div>

      {breakdown && locked && (
        <div className="cost-card">
          <h3>Live Overpaint Cost</h3>
          <ul className="cost-list">
            <li>
              <span>
                Point buy Δ ({breakdown.pointDelta > 0 ? '+' : ''}
                {breakdown.pointDelta} pts × {OVERPAINT.cePerPoint})
              </span>
              <Delta value={breakdown.ceFromPoints} suffix=" CE" />
            </li>
            <li>
              <span>Feats Δ (separate from point buy)</span>
              <Delta value={breakdown.ceFromFeats} suffix=" CE" />
            </li>
            <li>
              <span>Hit dice count Δ</span>
              <Delta value={breakdown.ceFromHitDice} suffix=" CE" />
            </li>
            <li>
              <span>
                Hit die size ({Math.abs(breakdown.hitDieStepDelta)} step
                {Math.abs(breakdown.hitDieStepDelta) === 1 ? '' : 's'})
              </span>
              <Delta value={breakdown.ceFromDieSize} suffix=" CE" />
            </li>
            <li>
              <span>Proficiencies Δ</span>
              <Delta value={breakdown.ceFromProficiencies} suffix=" CE" />
            </li>
          </ul>
          <div className="cost-total">
            <div>
              <strong>{formatSpend(breakdown.totalCeCost)}</strong>
              <p className="muted">
                Projected CE after Overpaint: <strong>{breakdown.projectedCe}</strong>
                {breakdown.projectedCe < 0 && (
                  <span className="delta-up"> — short by {Math.abs(breakdown.projectedCe)}</span>
                )}
              </p>
            </div>
            <button type="button" className="btn primary" onClick={onApplyProjectedCe}>
              Set New CE to Projected
            </button>
          </div>
        </div>
      )}

      {!locked && (
        <p className="hint-box">
          Enter your current stats and resources, then press <strong>Lock Current</strong>. After
          locking, Locked values stay fixed while New values update live.
        </p>
      )}
    </section>
  )
}

function ResourceRow({
  label,
  locked,
  value,
  min,
  onChange,
  hint,
}: {
  label: string
  locked?: number
  value: number
  min: number
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <label className="resource-row">
      <span className="resource-label">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <div className="resource-values">
        {locked != null && <span className="locked-pill">{locked}</span>}
        <input
          className="num-input"
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        />
      </div>
    </label>
  )
}