import { ABILITIES, createFeat, OVERPAINT } from '../constants'
import type { AbilityKey, FeatEntry } from '../types'
import { activeFeatCount } from '../utils/hp'

interface Props {
  locked: boolean
  feats: FeatEntry[]
  onChange: (feats: FeatEntry[]) => void
}

export function FeatPanel({ locked, feats, onChange }: Props) {
  const update = (id: string, patch: Partial<FeatEntry>) => {
    onChange(feats.map((feat) => (feat.id === id ? { ...feat, ...patch } : feat)))
  }

  const updateBonus = (id: string, key: AbilityKey, value: number) => {
    onChange(
      feats.map((feat) => {
        if (feat.id !== id) return feat
        const statBonuses = { ...feat.statBonuses }
        if (!value) delete statBonuses[key]
        else statBonuses[key] = value
        return { ...feat, statBonuses }
      }),
    )
  }

  const addFeat = () => {
    onChange([
      ...feats,
      createFeat({
        name: `Feat ${feats.length + 1}`,
        inCurrent: !locked,
        inNew: true,
      }),
    ])
  }

  const removeFeat = (id: string) => {
    const feat = feats.find((f) => f.id === id)
    if (!feat) return
    if (locked && feat.inCurrent) {
      update(id, { inNew: false })
      return
    }
    onChange(feats.filter((f) => f.id !== id))
  }

  const syncOwnership = (feat: FeatEntry, value: boolean) => {
    if (!locked) {
      update(feat.id, { inCurrent: value, inNew: value })
      return
    }
    update(feat.id, { inNew: value })
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Feats</h2>
          <p className="lede tight">
            Track each feat as Current vs New. Feat CE ({OVERPAINT.cePerFeat} each) is separate from
            point buy. Mark feats that edit stats or HP — those bonuses never use the point-buy pool.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={addFeat}>
          Add Feat
        </button>
      </div>

      <div className="feat-summary">
        <span>
          Current active: <strong>{activeFeatCount(feats, 'inCurrent')}</strong>
        </span>
        <span>
          New active: <strong>{activeFeatCount(feats, 'inNew')}</strong>
        </span>
        {locked && (
          <span>
            Δ feats:{' '}
            <strong>
              {activeFeatCount(feats, 'inNew') - activeFeatCount(feats, 'inCurrent') >= 0 ? '+' : ''}
              {activeFeatCount(feats, 'inNew') - activeFeatCount(feats, 'inCurrent')}
            </strong>
          </span>
        )}
      </div>

      {feats.length === 0 ? (
        <p className="hint-box">No feats yet. Add one to track Current/New ownership, HP, and stat edits.</p>
      ) : (
        <div className="feat-list">
          {feats.map((feat) => (
            <article key={feat.id} className="feat-card">
              <div className="feat-top">
                <input
                  className="text-input"
                  value={feat.name}
                  placeholder="Feat name"
                  onChange={(e) => update(feat.id, { name: e.target.value })}
                />
                <button type="button" className="btn ghost danger-text" onClick={() => removeFeat(feat.id)}>
                  {locked && feat.inCurrent ? 'Drop from New' : 'Remove'}
                </button>
              </div>

              <div className="feat-checks">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={feat.inCurrent}
                    disabled={locked}
                    onChange={(e) => syncOwnership(feat, e.target.checked)}
                  />
                  Current
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={feat.inNew}
                    onChange={(e) => syncOwnership(feat, e.target.checked)}
                  />
                  New
                </label>
                <span className="feat-status">{ownershipLabel(feat, locked)}</span>
              </div>

              <div className="feat-fields">
                <label className="field inline">
                  <span>HP from feat</span>
                  <input
                    className="num-input compact"
                    type="number"
                    value={feat.hpBonus}
                    onChange={(e) => update(feat.id, { hpBonus: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={feat.editsStats}
                    onChange={(e) => update(feat.id, { editsStats: e.target.checked })}
                  />
                  Edits stats (outside point buy)
                </label>
              </div>

              {feat.editsStats && (
                <div className="feat-stats">
                  <p className="muted small">
                    Stat bonuses apply when the feat is active. They change Total scores / HP CON, not
                    point-buy cost.
                  </p>
                  <div className="feat-stat-grid">
                    {ABILITIES.map(({ key, label }) => (
                      <label key={key} className="cost-cell">
                        <span>{label.slice(0, 3)}</span>
                        <input
                          className="num-input compact"
                          type="number"
                          value={feat.statBonuses[key] ?? 0}
                          onChange={(e) => updateBonus(feat.id, key, Number(e.target.value) || 0)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ownershipLabel(feat: FeatEntry, locked: boolean): string {
  if (!locked) return feat.inNew ? 'Active' : 'Inactive'
  if (feat.inCurrent && feat.inNew) return 'Kept'
  if (!feat.inCurrent && feat.inNew) return 'Added'
  if (feat.inCurrent && !feat.inNew) return 'Removed'
  return 'Unused'
}