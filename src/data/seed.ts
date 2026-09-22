import {
  DEMO_SCHEMA_VERSION,
  type DemoFile,
  type DemoInventory,
  type PersistedDemoState,
} from '../contracts'

const SEED_FILES = [
  {
    id: 'sem1-bee-lab-record',
    name: 'BEE_Lab_Record_Final.pdf',
    path: 'Documents/College/Sem1/BEE/BEE_Lab_Record_Final.pdf',
    bytes: 24_800_000,
    kind: 'document',
    modifiedAt: '2025-11-28T09:20:00.000Z',
    duplicateKey: 'sha256-fixture-bee-lab-record-v4',
    semanticScopes: ['semester_1'],
  },
  {
    id: 'download-bee-lab-record-copy',
    name: 'BEE_Lab_Record_Final (1).pdf',
    path: 'Download/BEE_Lab_Record_Final (1).pdf',
    bytes: 24_800_000,
    kind: 'document',
    modifiedAt: '2025-12-02T18:42:00.000Z',
    duplicateKey: 'sha256-fixture-bee-lab-record-v4',
    semanticScopes: ['download'],
  },
  {
    id: 'sem1-circuit-theory-lectures',
    name: 'Circuit_Theory_Recorded_Lectures.zip',
    path: 'Documents/College/Sem1/BEE/Circuit_Theory_Recorded_Lectures.zip',
    bytes: 428_400_000,
    kind: 'archive',
    modifiedAt: '2025-10-16T14:05:00.000Z',
    semanticScopes: ['semester_1'],
  },
  {
    id: 'sem1-engineering-graphics-demo',
    name: 'Engineering_Graphics_Practice_Demo.mp4',
    path: 'Documents/College/Sem1/Engineering Graphics/Engineering_Graphics_Practice_Demo.mp4',
    bytes: 376_250_000,
    kind: 'video',
    modifiedAt: '2025-09-23T07:55:00.000Z',
    semanticScopes: ['semester_1'],
  },
  {
    id: 'sem1-chemistry-lab-videos',
    name: 'Chemistry_Lab_Experiments.zip',
    path: 'Documents/College/Sem1/Chemistry/Chemistry_Lab_Experiments.zip',
    bytes: 292_700_000,
    kind: 'archive',
    modifiedAt: '2025-11-07T12:30:00.000Z',
    semanticScopes: ['semester_1'],
  },
  {
    id: 'sem1-workshop-submissions',
    name: 'Workshop_Submissions_Backup.zip',
    path: 'Documents/College/Sem1/Workshop/Workshop_Submissions_Backup.zip',
    bytes: 164_900_000,
    kind: 'archive',
    modifiedAt: '2025-12-10T16:10:00.000Z',
    semanticScopes: ['semester_1'],
  },
  {
    id: 'sem1-mathematics-notes',
    name: 'Engineering_Mathematics_I_Notes.pdf',
    path: 'Documents/College/Sem1/Mathematics/Engineering_Mathematics_I_Notes.pdf',
    bytes: 31_600_000,
    kind: 'document',
    modifiedAt: '2025-11-14T10:15:00.000Z',
    semanticScopes: ['semester_1'],
  },
  {
    id: 'sem2-signals-reference',
    name: 'Signals_and_Systems_Reference.pdf',
    path: 'Documents/College/Sem2/Signals/Signals_and_Systems_Reference.pdf',
    bytes: 42_300_000,
    kind: 'document',
    modifiedAt: '2026-01-12T08:35:00.000Z',
    duplicateKey: 'sha256-fixture-signals-reference',
    semanticScopes: ['semester_2'],
  },
  {
    id: 'download-signals-reference-copy',
    name: 'Signals_and_Systems_Reference (1).pdf',
    path: 'Download/Signals_and_Systems_Reference (1).pdf',
    bytes: 42_300_000,
    kind: 'document',
    modifiedAt: '2026-01-12T08:42:00.000Z',
    duplicateKey: 'sha256-fixture-signals-reference',
    semanticScopes: ['download'],
  },
  {
    id: 'sem2-data-structures-lectures',
    name: 'Data_Structures_Lecture_01-08.zip',
    path: 'Documents/College/Sem2/Data Structures/Data_Structures_Lecture_01-08.zip',
    bytes: 518_600_000,
    kind: 'archive',
    modifiedAt: '2026-02-18T17:25:00.000Z',
    semanticScopes: ['semester_2'],
  },
  {
    id: 'sem2-electronics-lab',
    name: 'Electronics_Lab_Observations.pdf',
    path: 'Documents/College/Sem2/Electronics/Electronics_Lab_Observations.pdf',
    bytes: 19_750_000,
    kind: 'document',
    modifiedAt: '2026-03-02T13:45:00.000Z',
    semanticScopes: ['semester_2'],
  },
  {
    id: 'camera-campus-fest',
    name: 'IMG_20260221_174233.jpg',
    path: 'DCIM/Camera/IMG_20260221_174233.jpg',
    bytes: 8_900_000,
    kind: 'image',
    modifiedAt: '2026-02-21T12:12:33.000Z',
    duplicateKey: 'sha256-fixture-campus-fest-photo',
    semanticScopes: ['camera'],
  },
  {
    id: 'download-campus-fest-copy',
    name: 'campus-fest-photo.jpg',
    path: 'Download/campus-fest-photo.jpg',
    bytes: 8_900_000,
    kind: 'image',
    modifiedAt: '2026-02-22T06:10:00.000Z',
    duplicateKey: 'sha256-fixture-campus-fest-photo',
    semanticScopes: ['download'],
  },
  {
    id: 'camera-project-board',
    name: 'IMG_20260305_101155.jpg',
    path: 'DCIM/Camera/IMG_20260305_101155.jpg',
    bytes: 10_450_000,
    kind: 'image',
    modifiedAt: '2026-03-05T04:41:55.000Z',
    semanticScopes: ['camera'],
  },
  {
    id: 'camera-cultural-night',
    name: 'VID_20260221_203501.mp4',
    path: 'DCIM/Camera/VID_20260221_203501.mp4',
    bytes: 734_200_000,
    kind: 'video',
    modifiedAt: '2026-02-21T15:05:01.000Z',
    semanticScopes: ['camera'],
  },
  {
    id: 'camera-hostel-tour',
    name: 'VID_20260107_182944.mp4',
    path: 'DCIM/Camera/VID_20260107_182944.mp4',
    bytes: 486_700_000,
    kind: 'video',
    modifiedAt: '2026-01-07T12:59:44.000Z',
    semanticScopes: ['camera'],
  },
  {
    id: 'download-orientation-recording',
    name: 'college_orientation_recording.mp4',
    path: 'Download/college_orientation_recording.mp4',
    bytes: 612_500_000,
    kind: 'video',
    modifiedAt: '2025-07-24T05:50:00.000Z',
    semanticScopes: ['download'],
  },
  {
    id: 'download-admission-documents',
    name: 'admission_documents_scans.zip',
    path: 'Download/admission_documents_scans.zip',
    bytes: 138_200_000,
    kind: 'archive',
    modifiedAt: '2025-06-19T11:05:00.000Z',
    semanticScopes: ['download'],
  },
  {
    id: 'download-ambiguous-sem1-pack',
    name: 'Sem1_notes_maybe_final.zip',
    path: 'Download/Sem1_notes_maybe_final.zip',
    bytes: 96_400_000,
    kind: 'archive',
    modifiedAt: '2026-02-06T19:30:00.000Z',
    semanticScopes: ['download'],
    ambiguousSemesterOne: true,
  },
  {
    id: 'download-scholarship-form',
    name: 'scholarship-renewal-form.pdf',
    path: 'Download/scholarship-renewal-form.pdf',
    bytes: 2_750_000,
    kind: 'document',
    modifiedAt: '2026-03-08T09:40:00.000Z',
    semanticScopes: ['download'],
  },
] as const satisfies readonly DemoFile[]

export interface SeedInventoryInput {
  updatedAt: string
  revision?: number
}

export interface ResetStateInput {
  currentRevision: number
  updatedAt: string
}

function cloneFile(file: (typeof SEED_FILES)[number]): DemoFile {
  return {
    ...file,
    semanticScopes: [...file.semanticScopes],
  }
}

/** Returns fresh metadata objects. No file content is created or downloaded. */
export function createSeedFiles(): DemoFile[] {
  return SEED_FILES.map(cloneFile)
}

export function createSeedInventory({
  updatedAt,
  revision = 1,
}: SeedInventoryInput): DemoInventory {
  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    revision,
    updatedAt,
    files: createSeedFiles(),
  }
}

/**
 * Produces the inventory portion of a reset without mutating the current state.
 * Advancing the revision invalidates every plan created before the reset.
 */
export function createResetInventory({
  currentRevision,
  updatedAt,
}: ResetStateInput): DemoInventory {
  return createSeedInventory({
    revision: currentRevision + 1,
    updatedAt,
  })
}

/** Pure input for the persistence owner; browser storage is intentionally untouched here. */
export function createResetState(input: ResetStateInput): PersistedDemoState {
  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    inventory: createResetInventory(input),
    activity: [],
  }
}

