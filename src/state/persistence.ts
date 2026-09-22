import {
  DEMO_SCHEMA_VERSION,
  DEMO_STORAGE_KEY,
  type DemoFile,
  type PersistedDemoState,
} from '../contracts'

export type LoadResult =
  | { kind: 'loaded'; state: PersistedDemoState }
  | { kind: 'empty' }
  | { kind: 'invalid'; notice: string }

function isDemoFile(value: unknown): value is DemoFile {
  if (!value || typeof value !== 'object') return false
  const file = value as Partial<DemoFile>
  return (
    typeof file.id === 'string' &&
    typeof file.name === 'string' &&
    typeof file.path === 'string' &&
    typeof file.bytes === 'number' &&
    Number.isFinite(file.bytes) &&
    file.bytes >= 0 &&
    typeof file.modifiedAt === 'string' &&
    Array.isArray(file.semanticScopes)
  )
}

function isPersistedState(value: unknown): value is PersistedDemoState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<PersistedDemoState>
  return (
    state.schemaVersion === DEMO_SCHEMA_VERSION &&
    !!state.inventory &&
    state.inventory.schemaVersion === DEMO_SCHEMA_VERSION &&
    Number.isInteger(state.inventory.revision) &&
    typeof state.inventory.updatedAt === 'string' &&
    Array.isArray(state.inventory.files) &&
    state.inventory.files.every(isDemoFile) &&
    Array.isArray(state.activity)
  )
}

export function loadPersistedState(storage: Pick<Storage, 'getItem'> = localStorage): LoadResult {
  const raw = storage.getItem(DEMO_STORAGE_KEY)
  if (!raw) return { kind: 'empty' }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (isPersistedState(parsed)) return { kind: 'loaded', state: parsed }
  } catch {
    // A corrupt value is handled the same as an incompatible schema below.
  }

  return {
    kind: 'invalid',
    notice: 'Saved demo data was incompatible and has been reset to the sample inventory.',
  }
}

export function savePersistedState(
  state: PersistedDemoState,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}

export function clearPersistedState(storage: Pick<Storage, 'removeItem'> = localStorage) {
  storage.removeItem(DEMO_STORAGE_KEY)
}
