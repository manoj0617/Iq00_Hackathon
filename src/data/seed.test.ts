import { describe, expect, it } from 'vitest'

import { DEMO_SCHEMA_VERSION } from '../contracts'
import {
  createResetInventory,
  createResetState,
  createSeedFiles,
  createSeedInventory,
} from './seed'

describe('demo seed', () => {
  it('provides realistic metadata across the required locations', () => {
    const files = createSeedFiles()

    expect(files.some((file) => file.path.startsWith('Documents/College/Sem1/'))).toBe(true)
    expect(files.some((file) => file.path.startsWith('Documents/College/Sem2/'))).toBe(true)
    expect(files.some((file) => file.path.startsWith('DCIM/Camera/'))).toBe(true)
    expect(files.some((file) => file.path.startsWith('Download/'))).toBe(true)
    expect(new Set(files.map((file) => file.id)).size).toBe(files.length)
    expect(new Set(files.map((file) => file.path)).size).toBe(files.length)
    expect(files.every((file) => file.bytes > 0)).toBe(true)
  })

  it('contains more than one decimal GB of removable Semester 1 metadata', () => {
    const removableSemesterOneBytes = createSeedFiles()
      .filter(
        (file) =>
          file.semanticScopes.includes('semester_1') && file.id !== 'sem1-bee-lab-record',
      )
      .reduce((total, file) => total + file.bytes, 0)

    expect(removableSemesterOneBytes).toBeGreaterThan(1_000_000_000)
  })

  it('declares BEE copies, protected duplicate anchors, and one ambiguous suggestion', () => {
    const files = createSeedFiles()
    const beeCopies = files.filter(
      (file) => file.duplicateKey === 'sha256-fixture-bee-lab-record-v4',
    )
    const protectedDuplicateKeys = new Set(
      files
        .filter(
          (file) =>
            file.semanticScopes.includes('semester_2') || file.semanticScopes.includes('camera'),
        )
        .map((file) => file.duplicateKey)
        .filter((key): key is string => Boolean(key)),
    )
    const ambiguousFiles = files.filter((file) => file.ambiguousSemesterOne)

    expect(beeCopies).toHaveLength(2)
    expect(beeCopies.map((file) => file.semanticScopes[0]).sort()).toEqual([
      'download',
      'semester_1',
    ])
    expect(beeCopies[0]?.bytes).toBe(beeCopies[1]?.bytes)
    expect(protectedDuplicateKeys).toEqual(
      new Set(['sha256-fixture-signals-reference', 'sha256-fixture-campus-fest-photo']),
    )
    expect(ambiguousFiles).toHaveLength(1)
    expect(ambiguousFiles[0]?.semanticScopes).toEqual(['download'])
  })

  it('returns fresh records and deterministic inventory metadata', () => {
    const first = createSeedFiles()
    const second = createSeedFiles()
    first[0]?.semanticScopes.push('download')

    expect(second[0]?.semanticScopes).toEqual(['semester_1'])
    expect(createSeedInventory({ updatedAt: '2026-09-22T00:00:00.000Z' })).toMatchObject({
      schemaVersion: DEMO_SCHEMA_VERSION,
      revision: 1,
      updatedAt: '2026-09-22T00:00:00.000Z',
    })
  })

  it('advances the revision on reset and clears demo activity', () => {
    const inventory = createResetInventory({
      currentRevision: 7,
      updatedAt: '2026-09-22T01:00:00.000Z',
    })
    const state = createResetState({
      currentRevision: 7,
      updatedAt: '2026-09-22T01:00:00.000Z',
    })

    expect(inventory.revision).toBe(8)
    expect(inventory.files).toEqual(createSeedFiles())
    expect(state.inventory).toEqual(inventory)
    expect(state.activity).toEqual([])
  })
})

