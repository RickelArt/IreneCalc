import { OVERPAINT } from '../constants'

export function OverpaintRates() {
  return (
    <section className="panel">
      <h2>Overpaint Exchange Rates</h2>
      <p className="lede">
        From the Overpaint ability: reshape a body or object by spending (or reclaiming) Cursed Energy
        through these trades. Aesthetic changes are free and not tracked here.
      </p>
      <div className="rates-grid">
        <article className="rate-card">
          <h3>Point Buy</h3>
          <p>
            <strong>1</strong> point-buy point ↔ <strong>{OVERPAINT.cePerPoint}</strong> Cursed Energy
          </p>
          <p className="muted">
            Stats use your Custom Rules min/max (Overpaint default 4–18). Racial bonuses are separate.
          </p>
        </article>
        <article className="rate-card">
          <h3>Cursed Feat</h3>
          <p>
            <strong>{OVERPAINT.cePerFeat}</strong> Cursed Energy ↔ <strong>1</strong> Cursed Feat
          </p>
          <p className="muted">
            Counted separately from point buy. Feat HP / stat edits never spend point-buy points.
          </p>
        </article>
        <article className="rate-card">
          <h3>Hit Dice</h3>
          <p>
            <strong>{OVERPAINT.cePerHitDie}</strong> CE ↔ <strong>+1</strong> hit die
          </p>
          <p>
            <strong>{OVERPAINT.cePerDieStep}</strong> CE ↔ die size ±1 step (d4↔d6↔d8↔d10↔d12)
          </p>
        </article>
        <article className="rate-card">
          <h3>Proficiency</h3>
          <p>
            <strong>1</strong> proficiency ↔ <strong>{OVERPAINT.cePerProficiency}</strong> Cursed Energy
          </p>
        </article>
      </div>
    </section>
  )
}