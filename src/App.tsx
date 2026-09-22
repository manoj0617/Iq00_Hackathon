import { useEffect, useMemo, useState } from 'react'
import type { ActivityEntry, CandidateScope, CleanupPlan, CleanupResult, DemoFile, ParsedIntent, ProtectedScope, WorkflowScreen } from './contracts'
import { DEMO_SCHEMA_VERSION, DEMO_STORAGE_KEY } from './contracts'
import { createResetState, createSeedInventory } from './data'
import { buildCleanupPlan, getBeeLabRecordFollowUp, parseIntent, setPlanSelection, updatePlanSelection } from './domain'
import { simulateCleanup } from './simulation'
import { clearPersistedState, loadPersistedState, savePersistedState } from './state/persistence'
import { ActivityScreen, AppShell, EvidenceDetailScreen, HomeScreen, IntentScreen, PlanScreen, ResultScreen, ReviewScreen, StorageScreen, type ActivityDayView, type FileRowView, type PlanGroupView, type PriorityView, type ProtectionView, type StorageGroupView } from './ui'

const HERO_REQUEST = 'Free at least 1 GB. Keep my Semester 2 files and DCIM/Camera photos. Start with exact duplicates and Semester 1 material.'
const EXAMPLES = [
  { id: 'hero', label: 'Free 1 GB safely', request: HERO_REQUEST },
  { id: 'duplicates', label: 'Find exact duplicates', request: 'Find exact duplicates.' },
  { id: 'semester', label: 'Clear Semester 1', request: 'Free 800 MB. Keep Semester 2 and Camera photos. Start with Semester 1 material.' },
]
const scopeCopy: Record<CandidateScope, { label: string; detail: string }> = {
  exact_duplicates: { label: 'Exact duplicates', detail: 'Fixture-declared identical content, with one copy retained.' },
  semester_1: { label: 'Semester 1 material', detail: 'Folder matches are included; ambiguous filename matches require review.' },
  old_downloads: { label: 'Old downloads', detail: 'Only included when explicitly requested.' },
}
const protectionCopy: Record<ProtectedScope, { label: string; detail: string }> = {
  semester_2: { label: 'Semester 2', detail: 'Current-semester sample files stay excluded.' },
  camera: { label: 'DCIM / Camera', detail: 'Camera photo and video fixtures stay excluded.' },
}

const isoNow = () => new Date().toISOString()
const bytesOf = (files: readonly DemoFile[]) => files.reduce((sum, file) => sum + file.bytes, 0)
const newActivity = (title: string, detail: string): ActivityEntry => ({ id: crypto.randomUUID(), at: isoNow(), title, detail })

function loadInitial() {
  const loaded = loadPersistedState()
  if (loaded.kind === 'loaded') return { ...loaded.state, notice: null as string | null }
  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    inventory: createSeedInventory({ updatedAt: isoNow() }),
    activity: [] as ActivityEntry[],
    notice: loaded.kind === 'invalid' ? loaded.notice : null,
  }
}

function activityDays(entries: ActivityEntry[]): ActivityDayView[] {
  const days = new Map<string, ActivityEntry[]>()
  for (const entry of entries) {
    const label = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(entry.at))
    days.set(label, [...(days.get(label) ?? []), entry])
  }
  return [...days].map(([label, dayEntries]) => ({ label, entries: dayEntries }))
}

export function App() {
  const initial = useMemo(loadInitial, [])
  const [inventory, setInventory] = useState(initial.inventory)
  const [activity, setActivity] = useState(initial.activity)
  const [notice, setNotice] = useState(initial.notice)
  const [screen, setScreen] = useState<WorkflowScreen>('home')
  const [request, setRequest] = useState(HERO_REQUEST)
  const [intent, setIntent] = useState<ParsedIntent | null>(null)
  const [targetValue, setTargetValue] = useState('1')
  const [targetUnit, setTargetUnit] = useState<'MB' | 'GB'>('GB')
  const [plan, setPlan] = useState<CleanupPlan | null>(null)
  const [result, setResult] = useState<CleanupResult | null>(null)
  const [removedFiles, setRemovedFiles] = useState<DemoFile[]>([])
  const [detailGroup, setDetailGroup] = useState<CandidateScope | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageGroup, setStorageGroup] = useState<string | null>(null)
  const [followQuestion, setFollowQuestion] = useState('Do I still have duplicates of my BEE lab record?')
  const [followAnswer, setFollowAnswer] = useState<string | null>(null)

  useEffect(() => savePersistedState({ schemaVersion: DEMO_SCHEMA_VERSION, inventory, activity }), [inventory, activity])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [screen, detailGroup])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== DEMO_STORAGE_KEY) return
      const loaded = loadPersistedState()
      if (loaded.kind !== 'loaded' || loaded.state.inventory.revision === inventory.revision) return
      setInventory(loaded.state.inventory); setActivity(loaded.state.activity); setIntent(null); setPlan(null); setResult(null); setScreen('home')
      setNotice('The demo inventory changed in another tab. Build a new plan from the latest revision.')
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [inventory.revision])

  const fileMap = useMemo(() => new Map(inventory.files.map((file) => [file.id, file])), [inventory])
  const log = (title: string, detail: string) => setActivity((entries) => [newActivity(title, detail), ...entries])
  const evidenceFor = (id: string) => plan?.candidates.find((candidate) => candidate.fileId === id)?.evidence ?? []

  function inspect(value = request) {
    if (!value.trim()) { setError('Enter a supported cleanup request.'); return }
    const parsed = parseIntent(value)
    setRequest(value); setIntent(parsed); setPlan(null); setResult(null); setError(null); setScreen('intent')
    if (parsed.targetBytes) {
      const gb = parsed.targetBytes >= 1_000_000_000
      setTargetUnit(gb ? 'GB' : 'MB'); setTargetValue(String(parsed.targetBytes / (gb ? 1_000_000_000 : 1_000_000)))
    } else { setTargetUnit('GB'); setTargetValue('') }
    log('Request interpreted', 'Supported wording was converted into editable demo constraints.')
  }

  function toggleProtection(scope: ProtectedScope, enabled: boolean) {
    setIntent((current) => {
      if (!current) return current
      const next = new Set(current.protectedScopes); enabled ? next.add(scope) : next.delete(scope)
      return { ...current, protectedScopes: [...next] }
    })
  }

  function movePriority(scope: CandidateScope, direction: 'up' | 'down') {
    setIntent((current) => {
      if (!current) return current
      const from = current.priorities.indexOf(scope); const to = direction === 'up' ? from - 1 : from + 1
      if (from < 0 || to < 0 || to >= current.priorities.length) return current
      const priorities = [...current.priorities]; [priorities[from], priorities[to]] = [priorities[to], priorities[from]]
      return { ...current, priorities }
    })
  }

  function buildPlan() {
    if (!intent) return
    const amount = Number(targetValue)
    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter a target greater than zero.'); return }
    if (!intent.priorities.length) { setError('Choose at least one supported cleanup priority.'); return }
    const edited = { ...intent, targetBytes: Math.round(amount * (targetUnit === 'GB' ? 1_000_000_000 : 1_000_000)) }
    const next = buildCleanupPlan(inventory, edited)
    setIntent(edited); setPlan(next); setError(null); setDetailGroup(null); setScreen('plan')
    log('Cleanup plan built', `${next.selectedIds.length} sample records selected from revision ${inventory.revision}.`)
  }

  function toggleFile(id: string, selected: boolean) {
    if (!plan) return
    try { setPlan(updatePlanSelection(plan, inventory, id, selected)); setError(null) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'That selection is no longer available.') }
  }

  function toggleGroup(group: string, selected: boolean) {
    if (!plan) return
    const groupIds = plan.candidates.filter((candidate) => candidate.bucket === group).map((candidate) => candidate.fileId)
    const ids = new Set(plan.selectedIds); for (const id of groupIds) selected ? ids.add(id) : ids.delete(id)
    try { setPlan(setPlanSelection(plan, inventory, [...ids])); setError(null) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'That group could not be updated.') }
  }

  function confirmCleanup() {
    if (!plan) return
    const before = new Map(inventory.files.map((file) => [file.id, file]))
    const outcome = simulateCleanup({ inventory, plan, operationId: crypto.randomUUID(), completedAt: isoNow(), confirmed: true })
    if (outcome.status !== 'completed') {
      setConfirmOpen(false); setError(outcome.status === 'rejected' ? `Simulation blocked: ${outcome.reason.replaceAll('_', ' ')}.` : 'Simulation was not applied.'); return
    }
    setRemovedFiles(outcome.result.removedIds.flatMap((id) => before.get(id) ? [before.get(id)!] : []))
    setInventory(outcome.inventory); setResult(outcome.result); setConfirmOpen(false); setFollowAnswer(null); setScreen('result')
    log('Cleanup simulated', `${outcome.result.removedIds.length} sample records were removed from the demo inventory.`)
  }

  function resetDemo() {
    const reset = createResetState({ currentRevision: inventory.revision, updatedAt: isoNow() })
    clearPersistedState(); setInventory(reset.inventory); setActivity([]); setIntent(null); setPlan(null); setResult(null); setRemovedFiles([])
    setDetailGroup(null); setConfirmOpen(false); setFollowAnswer(null); setError(null); setNotice('The complete sample inventory has been restored.'); setRequest(HERO_REQUEST); setScreen('home')
  }

  const protections: ProtectionView[] = (intent?.protectedScopes ?? []).map((scope) => ({
    scope, ...protectionCopy[scope], coveredCount: inventory.files.filter((file) => scope === 'semester_2' ? file.semanticScopes.includes('semester_2') : file.semanticScopes.includes('camera')).length,
  }))
  const priorities: PriorityView[] = (intent?.priorities ?? []).map((scope) => ({ scope, ...scopeCopy[scope] }))
  const groups: PlanGroupView[] = (intent?.priorities ?? []).flatMap((scope) => {
    if (!plan) return []
    const candidates = plan.candidates.filter((candidate) => candidate.bucket === scope)
    if (!candidates.length) return []
    const selected = candidates.filter((candidate) => plan.selectedIds.includes(candidate.fileId))
    return [{ id: scope, title: scopeCopy[scope].label, description: scopeCopy[scope].detail, itemCount: candidates.length, selectedCount: selected.length,
      selectedBytes: selected.reduce((sum, candidate) => sum + (fileMap.get(candidate.fileId)?.bytes ?? 0), 0),
      evidenceTone: scope === 'exact_duplicates' ? 'proven' : scope === 'semester_1' ? 'directed' : 'metadata',
      evidenceLabel: scope === 'exact_duplicates' ? 'Fixture duplicate' : scope === 'semester_1' ? 'User-directed' : 'Metadata',
      selected: selected.length === candidates.length, reviewRequired: candidates.some((candidate) => candidate.evidence.some((item) => item.requiresReview)) }]
  })
  const selectedRows: FileRowView[] = plan?.selectedIds.flatMap((id) => fileMap.get(id) ? [{ file: fileMap.get(id)!, evidence: evidenceFor(id), selected: true }] : []) ?? []
  const storageGroups: StorageGroupView[] = ([
    ['semester_1', 'Semester 1', 'Previous-semester sample files'], ['semester_2', 'Semester 2', 'Protected current-semester sample files'],
    ['camera', 'Camera', 'Protected photo and video fixtures'], ['download', 'Downloads', 'Downloaded sample records'],
  ] as const).map(([id, label, detail]) => {
    const files = inventory.files.filter((file) => file.semanticScopes.includes(id)); return { id, label, detail, fileCount: files.length, bytes: bytesOf(files) }
  })

  function content() {
    if (detailGroup && plan) {
      const candidateIds = plan.candidates.filter((candidate) => candidate.bucket === detailGroup).map((candidate) => candidate.fileId)
      const ids = detailGroup === 'exact_duplicates' ? [...new Set(plan.duplicateGroups.flatMap((group) => group.memberIds))] : candidateIds
      const rows = ids.flatMap((id): FileRowView[] => fileMap.get(id) ? [{ file: fileMap.get(id)!, evidence: evidenceFor(id), selected: plan.selectedIds.includes(id), protected: plan.protectedIds.includes(id), retained: plan.retainedIds.includes(id) }] : [])
      return <EvidenceDetailScreen title={scopeCopy[detailGroup].label} description={scopeCopy[detailGroup].detail} evidenceLabel={detailGroup === 'exact_duplicates' ? 'Same fixture content key' : 'Scope evidence'} totalBytes={candidateIds.filter((id) => plan.selectedIds.includes(id)).reduce((sum, id) => sum + (fileMap.get(id)?.bytes ?? 0), 0)} files={rows} retainedSummary={detailGroup === 'exact_duplicates' ? `${plan.retainedIds.length} copy is retained across the current duplicate groups.` : undefined} onToggleFile={toggleFile} onBack={() => setDetailGroup(null)} />
    }
    if (screen === 'intent' && intent) return <IntentScreen intent={intent} targetValue={targetValue} targetUnit={targetUnit} onTargetValueChange={setTargetValue} onTargetUnitChange={setTargetUnit} protections={(Object.keys(protectionCopy) as ProtectedScope[]).map((scope) => ({ scope, ...protectionCopy[scope], checked: intent.protectedScopes.includes(scope) }))} onToggleProtection={toggleProtection} priorities={priorities} onMovePriority={movePriority} onBack={() => setScreen('home')} onContinue={buildPlan} error={error} />
    if (screen === 'plan' && plan) return <PlanScreen plan={plan} groups={groups} protections={protections} onOpenGroup={(id) => setDetailGroup(id as CandidateScope)} onToggleGroup={toggleGroup} onAdjustConstraints={() => setScreen('intent')} onReview={() => setScreen('review')} />
    if (screen === 'review' && plan) return <ReviewScreen plan={plan} files={selectedRows} protections={protections} retainedCount={plan.retainedIds.length} confirmationOpen={confirmOpen} onToggleFile={toggleFile} onAdjust={() => setScreen('plan')} onRequestCleanup={() => setConfirmOpen(true)} onCancelCleanup={() => setConfirmOpen(false)} onConfirmCleanup={confirmCleanup} />
    if (screen === 'result' && result) return <ResultScreen result={result} removedFiles={removedFiles} checks={result.checks} inventoryFileCount={inventory.files.length} inventoryBytes={bytesOf(inventory.files)} followUp={{ question: followQuestion, answer: followAnswer }} onFollowUpChange={setFollowQuestion} onAskFollowUp={() => { const answer = getBeeLabRecordFollowUp(inventory, followQuestion); setFollowAnswer(`${answer.headline}. ${answer.detail}${answer.matchingFiles.length ? ` Remaining: ${answer.matchingFiles.map((file) => file.path).join(', ')}.` : ''}`) }} onViewStorage={() => setScreen('storage')} onStartOver={() => { setIntent(null); setPlan(null); setResult(null); setScreen('home') }} />
    if (screen === 'storage') { const files = inventory.files.filter((file) => !storageGroup || file.semanticScopes.includes(storageGroup as DemoFile['semanticScopes'][number])); return <StorageScreen inventory={inventory} groups={storageGroups} files={files.map((file) => ({ file, evidence: [] }))} selectedGroupId={storageGroup} onSelectGroup={setStorageGroup} onReset={resetDemo} /> }
    if (screen === 'activity') return <ActivityScreen days={activityDays(activity)} />
    return <HomeScreen request={request} onRequestChange={setRequest} onSubmit={() => inspect()} examples={EXAMPLES} onChooseExample={(value) => { setRequest(value); inspect(value) }} fileCount={inventory.files.length} totalBytes={bytesOf(inventory.files)} updatedAt={inventory.updatedAt} persistenceNotice={notice} error={error} />
  }

  const back = detailGroup ? () => setDetailGroup(null) : screen === 'intent' ? () => setScreen('home') : screen === 'plan' ? () => setScreen('intent') : screen === 'review' ? () => setScreen('plan') : screen === 'result' ? () => setScreen('home') : undefined
  return <AppShell currentScreen={screen} onNavigate={(next) => { setDetailGroup(null); setConfirmOpen(false); setScreen(next) }} onBack={back} onReset={screen === 'home' ? resetDemo : undefined}>{content()}</AppShell>
}
