import { describe, expect, it } from 'vitest'
import { DEMO_SCHEMA_VERSION, DEMO_STORAGE_KEY, type PersistedDemoState } from '../contracts'
import { clearPersistedState, loadPersistedState, savePersistedState } from './persistence'

function memoryStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(DEMO_STORAGE_KEY, initial)
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    values,
  }
}

const valid: PersistedDemoState = {
  schemaVersion: DEMO_SCHEMA_VERSION,
  inventory: {
    schemaVersion: DEMO_SCHEMA_VERSION,
    revision: 2,
    updatedAt: '2026-09-22T10:00:00.000Z',
    files: [],
  },
  activity: [],
}

describe('demo persistence', () => {
  it('round-trips validated state under the app-specific key', () => {
    const storage = memoryStorage()
    savePersistedState(valid, storage)
    expect(loadPersistedState(storage)).toEqual({ kind: 'loaded', state: valid })
  })

  it('rejects corrupt or incompatible values', () => {
    expect(loadPersistedState(memoryStorage('{broken'))).toMatchObject({ kind: 'invalid' })
    expect(loadPersistedState(memoryStorage(JSON.stringify({ schemaVersion: 999 })))).toMatchObject({
      kind: 'invalid',
    })
  })

  it('clears only the demo key', () => {
    const storage = memoryStorage()
    storage.values.set('unrelated', 'keep')
    savePersistedState(valid, storage)
    clearPersistedState(storage)
    expect(storage.values.get(DEMO_STORAGE_KEY)).toBeUndefined()
    expect(storage.values.get('unrelated')).toBe('keep')
  })
})
