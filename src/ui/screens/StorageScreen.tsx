import { Database, RotateCcw } from 'lucide-react'
import type { DemoInventory } from '../../contracts'
import type { FileRowView, StorageGroupView } from '../types'
import { formatBytes, formatDate } from '../format'
import { Button, PageHeading } from '../components/Primitives'
import { FileRow } from '../components/Rows'

export interface StorageScreenProps {
  inventory: DemoInventory
  groups: StorageGroupView[]
  files: FileRowView[]
  selectedGroupId?: string | null
  onSelectGroup: (groupId: string | null) => void
  onOpenFile?: (fileId: string) => void
  onReset: () => void
}

export function StorageScreen({ inventory, groups, files, selectedGroupId, onSelectGroup, onOpenFile, onReset }: StorageScreenProps) {
  const totalBytes = inventory.files.reduce((total, file) => total + file.bytes, 0)
  return (
    <div className="screen">
      <PageHeading title="Demo storage" description={`Revision ${inventory.revision} · Updated ${formatDate(inventory.updatedAt)}`} />
      <div className="storage-total"><Database aria-hidden="true" /><span><small>Sample inventory</small><strong className="numeric">{formatBytes(totalBytes)}</strong><b>{inventory.files.length} files</b></span></div>

      <section className="screen-section" aria-labelledby="storage-groups-heading">
        <div className="section-heading"><div><h2 id="storage-groups-heading">Browse by location</h2><p>These totals reflect the current demo inventory.</p></div></div>
        <div className="storage-tabs" aria-label="Inventory groups">
          <button type="button" aria-pressed={selectedGroupId == null} onClick={() => onSelectGroup(null)}>All files</button>
          {groups.map((group) => <button key={group.id} type="button" aria-pressed={selectedGroupId === group.id} onClick={() => onSelectGroup(group.id)}>{group.label}<span>{group.fileCount} · {formatBytes(group.bytes)}</span></button>)}
        </div>
      </section>

      <section className="screen-section" aria-labelledby="inventory-files-heading">
        <div className="section-heading"><div><h2 id="inventory-files-heading">Files</h2><p>{files.length} records in this view.</p></div></div>
        {files.length > 0 ? <div className="grouped-list">{files.map((row) => <FileRow key={row.file.id} {...row} onOpen={onOpenFile} />)}</div> : <div className="empty-state"><Database aria-hidden="true" /><h3>No files in this view</h3><p>Choose another location to inspect the current inventory.</p></div>}
      </section>

      <div className="reset-zone"><div><h2>Restore the sample inventory</h2><p>Reset clears this demo’s saved state and activity, then restores all seed records.</p></div><Button variant="secondary" type="button" onClick={onReset}><RotateCcw aria-hidden="true" /> Reset demo</Button></div>
    </div>
  )
}
