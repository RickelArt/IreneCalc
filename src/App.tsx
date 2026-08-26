import { useMemo, useState } from 'react'
import { AttributeTable } from './components/AttributeTable'
import { BeforeAfterPanel } from './components/BeforeAfterPanel'
import { CustomRulesPanel } from './components/CustomRulesPanel'
import { FeatPanel } from './components/FeatPanel'
import { HpPanel } from './components/HpPanel'
import { OverpaintRates } from './components/OverpaintRates'
import { OverpaintResources } from './components/OverpaintResources'
import { SheetIoBar } from './components/SheetIoBar'
import {
  cloneSheet,
  createDefaultSheet,
  defaultRacialBonuses,
  DEFAULT_RULES,
  lockFeatOwnership,
} from './constants'
import type { AbilityKey, FeatEntry, PointBuyRules, SheetState, TabId } from './types'
import { computeOverpaintCost } from './utils/overpaint'
import type { SheetScope } from './utils/sheetIo'
import { totalPointCost } from './utils/pointBuy'
import './App.css'

function normalizeSheet(raw: SheetState): SheetState {
  const legacy = raw as SheetState & { feats: FeatEntry[] | number }
  let feats: FeatEntry[] = []

  if (Array.isArray(legacy.feats)) {
    feats = legacy.feats.map((feat) => ({
      id: feat.id || crypto.randomUUID(),
      name: feat.name || 'Feat',
      hpBonus: feat.hpBonus ?? 0,
      ceBonus: feat.ceBonus ?? 0,
      editsStats: Boolean(feat.editsStats),
      statBonuses: { ...(feat.statBonuses ?? {}) },
      inCurrent: feat.inCurrent ?? true,
      inNew: feat.inNew ?? true,
    }))
  } else if (typeof legacy.feats === 'number') {
    feats = Array.from({ length: Math.max(0, legacy.feats) }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `Feat ${i + 1}`,
      hpBonus: 0,
      ceBonus: 0,
      editsStats: false,
      statBonuses: {},
      inCurrent: true,
      inNew: true,
    }))
  }

  const defaults = defaultRacialBonuses()
  const racialBonuses: Record<AbilityKey, number> = { ...defaults }
  for (const key of Object.keys(defaults) as AbilityKey[]) {
    racialBonuses[key] = raw.racialBonuses?.[key] ?? defaults[key]
  }

  return {
    ...raw,
    feats,
    racialBonuses,
  }
}

export default function App() {
  const [tab, setTab] = useState<TabId>('calculator')
  const [rules, setRules] = useState<PointBuyRules>(DEFAULT_RULES)
  const [draft, setDraft] = useState<SheetState>(() => createDefaultSheet(DEFAULT_RULES))
  const [locked, setLocked] = useState<SheetState | null>(null)

  const spent = useMemo(() => totalPointCost(draft.scores, rules), [draft.scores, rules])
  const breakdown = useMemo(
    () => (locked ? computeOverpaintCost(locked, draft, rules) : null),
    [locked, draft, rules],
  )

  const updateScore = (key: AbilityKey, value: number) => {
    setDraft((prev) => ({
      ...prev,
      scores: { ...prev.scores, [key]: value },
    }))
  }

  const updateRacialBonus = (key: AbilityKey, value: number) => {
    setDraft((prev) => ({
      ...prev,
      racialBonuses: { ...prev.racialBonuses, [key]: value },
    }))
  }

  const updateResource = <K extends keyof SheetState>(key: K, value: SheetState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const lockCurrent = () => {
    const synced = lockFeatOwnership(draft)
    setDraft(synced)
    setLocked(cloneSheet(synced))
  }

  const unlock = () => setLocked(null)

  const resetDraftToLocked = () => {
    if (locked) setDraft(cloneSheet(locked))
  }

  const applyProjectedCe = () => {
    if (breakdown) setDraft((prev) => ({ ...prev, cursedEnergy: breakdown.projectedCe }))
  }

  const resetCalculator = () => {
    setDraft(createDefaultSheet(rules))
    setLocked(null)
  }

  const applyLoaded = ({
    scope,
    rules: nextRules,
    locked: nextLocked,
    draft: nextDraft,
  }: {
    scope: SheetScope
    rules: PointBuyRules
    locked: SheetState | null
    draft: SheetState | null
  }) => {
    setRules(nextRules)

    if (scope === 'locked' && nextLocked) {
      const sheet = normalizeSheet(nextLocked)
      setLocked(cloneSheet(sheet))
      setDraft(cloneSheet(sheet))
      return
    }

    if (scope === 'new' && nextDraft) {
      setDraft(normalizeSheet(nextDraft))
      return
    }

    if (scope === 'both') {
      const draftSheet = nextDraft ? normalizeSheet(nextDraft) : null
      const lockedSheet = nextLocked ? normalizeSheet(nextLocked) : null
      if (draftSheet) setDraft(draftSheet)
      setLocked(lockedSheet)
      if (!draftSheet && lockedSheet) setDraft(cloneSheet(lockedSheet))
    }
  }

  return (
    <div className="app">
      <header className="top">
        <h1>Overpaint Point Buy</h1>
        <p className="tagline">5e point buy with locked current vs live Overpaint changes</p>
      </header>

      <nav className="tabs" aria-label="Primary">
        <button
          type="button"
          className={tab === 'calculator' ? 'tab active' : 'tab'}
          onClick={() => setTab('calculator')}
        >
          Calculator
        </button>
        <button
          type="button"
          className={tab === 'compare' ? 'tab active' : 'tab'}
          onClick={() => setTab('compare')}
        >
          Before vs After
        </button>
        <button
          type="button"
          className={tab === 'custom' ? 'tab active' : 'tab'}
          onClick={() => setTab('custom')}
        >
          Custom Rules
        </button>
        <button
          type="button"
          className={tab === 'overpaint' ? 'tab active' : 'tab'}
          onClick={() => setTab('overpaint')}
        >
          Overpaint Rates
        </button>
      </nav>

      <SheetIoBar rules={rules} locked={locked} draft={draft} onApply={applyLoaded} />

      <main>
        {tab === 'calculator' && (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Calculator</h2>
                  <p className="lede tight">
                    {locked
                      ? 'Locked columns freeze pre-Overpaint point-buy and race. Race/feat bonuses stay outside the pool.'
                      : 'Set point-buy bases and race bonuses (+1 all by default), then lock before Overpainting.'}
                  </p>
                </div>
                {locked && <span className="status-chip">Locked mode</span>}
              </div>

              <AttributeTable
                locked={locked}
                draft={draft}
                rules={rules}
                onChangeScore={updateScore}
                onChangeRacialBonus={updateRacialBonus}
              />

              <div className="footer-bar">
                <button type="button" className="btn ghost" onClick={resetCalculator}>
                  Reset
                </button>
                <div className="points-readout">
                  <span>
                    Total Points{' '}
                    <strong className={spent > rules.availablePoints ? 'delta-up' : ''}>
                      {spent}/{rules.availablePoints}
                    </strong>
                  </span>
                  {locked && breakdown && (
                    <span className="muted">
                      Point Δ {breakdown.pointDelta > 0 ? '+' : ''}
                      {breakdown.pointDelta} → {breakdown.ceFromPoints > 0 ? '+' : ''}
                      {breakdown.ceFromPoints} CE
                    </span>
                  )}
                </div>
              </div>
            </section>

            <OverpaintResources
              locked={locked}
              draft={draft}
              breakdown={breakdown}
              onChange={updateResource}
              onLock={lockCurrent}
              onUnlock={unlock}
              onResetDraft={resetDraftToLocked}
              onApplyProjectedCe={applyProjectedCe}
            />

            <FeatPanel
              locked={Boolean(locked)}
              feats={draft.feats}
              onChange={(feats) => updateResource('feats', feats)}
            />

            <HpPanel locked={locked} draft={draft} />
          </>
        )}

        {tab === 'compare' && (
          <BeforeAfterPanel locked={locked} draft={draft} rules={rules} breakdown={breakdown} />
        )}

        {tab === 'custom' && <CustomRulesPanel rules={rules} onChange={setRules} />}
        {tab === 'overpaint' && <OverpaintRates />}
      </main>
    </div>
  )
}