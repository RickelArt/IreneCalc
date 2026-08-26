import { DEFAULT_COSTS, DEFAULT_RULES } from '../constants'
import type { PointBuyRules } from '../types'

interface Props {
  rules: PointBuyRules
  onChange: (next: PointBuyRules) => void
}

export function CustomRulesPanel({ rules, onChange }: Props) {
  const setField = <K extends keyof PointBuyRules>(key: K, value: PointBuyRules[K]) => {
    onChange({ ...rules, [key]: value })
  }

  const setCost = (score: number, cost: number) => {
    onChange({
      ...rules,
      costs: { ...rules.costs, [score]: cost },
    })
  }

  const reset = () => onChange({ ...DEFAULT_RULES, costs: { ...DEFAULT_COSTS } })

  const scores = Array.from({ length: 20 }, (_, i) => i + 1)

  return (
    <section className="panel">
      <h2>Custom Rules</h2>
      <p className="lede">
        Adjust available points, score bounds, and the cost of each score from 1–20. Overpaint defaults
        use min 4 / max 18.
      </p>

      <div className="rules-grid">
        <div className="rules-general">
          <label className="field">
            <span>Available Points</span>
            <input
              className="num-input"
              type="number"
              value={rules.availablePoints}
              onChange={(e) => setField('availablePoints', Number(e.target.value) || 0)}
            />
          </label>
          <label className="field">
            <span>Maximum Purchasable Attribute</span>
            <input
              className="num-input"
              type="number"
              min={1}
              max={20}
              value={rules.maxScore}
              onChange={(e) => setField('maxScore', Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
          <label className="field">
            <span>Minimum Purchasable Attribute</span>
            <input
              className="num-input"
              type="number"
              min={1}
              max={20}
              value={rules.minScore}
              onChange={(e) => setField('minScore', Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
          <button type="button" className="btn ghost" onClick={reset}>
            Full Reset
          </button>
        </div>

        <div className="rules-costs">
          <h3>Adjust Point Costs (1–20)</h3>
          <div className="cost-grid">
            {scores.map((score) => (
              <label key={score} className="cost-cell">
                <span>{score}:</span>
                <input
                  className="num-input compact"
                  type="number"
                  value={rules.costs[score] ?? 0}
                  onChange={(e) => setCost(score, Number(e.target.value) || 0)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}