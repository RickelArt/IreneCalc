import { useRef, useState, type ChangeEvent } from 'react'
import type { PointBuyRules, SheetState } from '../types'
import {
  buildSaveFile,
  downloadSaveFile,
  parseSaveFile,
  scopeLabel,
  type SheetSaveFile,
  type SheetScope,
} from '../utils/sheetIo'

interface Props {
  rules: PointBuyRules
  locked: SheetState | null
  draft: SheetState
  onApply: (payload: {
    scope: SheetScope
    rules: PointBuyRules
    locked: SheetState | null
    draft: SheetState | null
  }) => void
}

export function SheetIoBar({ rules, locked, draft, onApply }: Props) {
  const [scope, setScope] = useState<SheetScope>('both')
  const [status, setStatus] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportSheet = () => {
    if (scope === 'locked' && !locked) {
      setStatus('No Locked sheet yet — exporting current values as Locked (old).')
    } else {
      setStatus(`Exported ${scopeLabel(scope)}.`)
    }
    const file = buildSaveFile(scope, rules, locked, draft)
    downloadSaveFile(file, scope)
    localStorage.setItem('overpaint-point-buy', JSON.stringify(file))
  }

  const openPicker = () => fileRef.current?.click()

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseSaveFile(JSON.parse(text) as unknown)
      applyParsed(parsed, scope)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load file.')
    }
  }

  const loadFromBrowser = () => {
    const raw = localStorage.getItem('overpaint-point-buy')
    if (!raw) {
      setStatus('No browser save found. Use Load file or Export first.')
      return
    }
    try {
      const parsed = parseSaveFile(JSON.parse(raw) as unknown)
      applyParsed(parsed, scope)
    } catch {
      setStatus('Browser save was invalid.')
    }
  }

  const applyParsed = (parsed: SheetSaveFile, applyScope: SheetScope) => {
    if (applyScope === 'locked') {
      const sheet = parsed.locked ?? parsed.draft
      if (!sheet) {
        setStatus('This file has no Locked (old) sheet.')
        return
      }
      onApply({ scope: 'locked', rules: parsed.rules, locked: sheet, draft: null })
      setStatus('Loaded Locked (old).')
      return
    }

    if (applyScope === 'new') {
      const sheet = parsed.draft ?? parsed.locked
      if (!sheet) {
        setStatus('This file has no New sheet.')
        return
      }
      onApply({ scope: 'new', rules: parsed.rules, locked: null, draft: sheet })
      setStatus('Loaded New.')
      return
    }

    if (!parsed.draft && !parsed.locked) {
      setStatus('This file has no sheet data.')
      return
    }

    onApply({
      scope: 'both',
      rules: parsed.rules,
      locked: parsed.locked,
      draft: parsed.draft ?? parsed.locked,
    })
    setStatus('Loaded both sheets.')
  }

  return (
    <div className="io-bar">
      <label className="io-scope">
        <span>Scope</span>
        <select
          className="select-input io-select"
          value={scope}
          onChange={(e) => setScope(e.target.value as SheetScope)}
        >
          <option value="locked">Locked (old)</option>
          <option value="new">New</option>
          <option value="both">Both</option>
        </select>
      </label>
      <button type="button" className="btn ghost" onClick={openPicker}>
        Load file
      </button>
      <button type="button" className="btn ghost" onClick={loadFromBrowser}>
        Load browser
      </button>
      <button type="button" className="btn primary" onClick={exportSheet}>
        Export
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={onFileChosen}
      />
      {status && <span className="io-status">{status}</span>}
    </div>
  )
}
