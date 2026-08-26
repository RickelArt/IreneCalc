import type { PointBuyRules, SheetState } from '../types'

export type SheetScope = 'locked' | 'new' | 'both'

export interface SheetSaveFile {
  version: 1
  kind: SheetScope
  rules: PointBuyRules
  locked: SheetState | null
  draft: SheetState | null
  savedAt: string
}

export function buildSaveFile(
  scope: SheetScope,
  rules: PointBuyRules,
  locked: SheetState | null,
  draft: SheetState,
): SheetSaveFile {
  if (scope === 'locked') {
    return {
      version: 1,
      kind: 'locked',
      rules,
      locked: locked ? structuredClone(locked) : structuredClone(draft),
      draft: null,
      savedAt: new Date().toISOString(),
    }
  }

  if (scope === 'new') {
    return {
      version: 1,
      kind: 'new',
      rules,
      locked: null,
      draft: structuredClone(draft),
      savedAt: new Date().toISOString(),
    }
  }

  return {
    version: 1,
    kind: 'both',
    rules,
    locked: locked ? structuredClone(locked) : null,
    draft: structuredClone(draft),
    savedAt: new Date().toISOString(),
  }
}

export function downloadSaveFile(file: SheetSaveFile, scope: SheetScope) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const name = `overpaint-${scope}-${stamp}.json`
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function parseSaveFile(raw: unknown): SheetSaveFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid save file')
  }

  const data = raw as Partial<SheetSaveFile> & {
    locked?: SheetState | null
    draft?: SheetState | null
  }

  // Legacy browser saves (no version/kind)
  if (!('version' in data) && (data.draft || data.locked)) {
    return {
      version: 1,
      kind: data.locked && data.draft ? 'both' : data.locked ? 'locked' : 'new',
      rules: data.rules as PointBuyRules,
      locked: data.locked ?? null,
      draft: data.draft ?? null,
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : new Date().toISOString(),
    }
  }

  if (data.version !== 1 || !data.rules) {
    throw new Error('Unsupported or incomplete save file')
  }

  const kind: SheetScope =
    data.kind === 'locked' || data.kind === 'new' || data.kind === 'both'
      ? data.kind
      : data.locked && data.draft
        ? 'both'
        : data.locked
          ? 'locked'
          : 'new'

  return {
    version: 1,
    kind,
    rules: data.rules,
    locked: data.locked ?? null,
    draft: data.draft ?? null,
    savedAt: data.savedAt ?? new Date().toISOString(),
  }
}

export function scopeLabel(scope: SheetScope): string {
  if (scope === 'locked') return 'Locked (old)'
  if (scope === 'new') return 'New'
  return 'Both'
}
