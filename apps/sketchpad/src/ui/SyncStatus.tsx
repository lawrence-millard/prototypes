import { useSyncExternalStore } from 'react'
import { getSyncPhase, subscribeSync, type SyncPhase } from '../sync/client'

const LABEL: Record<SyncPhase, string> = {
  local: 'On this device',
  syncing: 'Syncing',
  synced: 'Synced',
  offline: 'Offline',
}

export function SyncStatus() {
  const phase = useSyncExternalStore(subscribeSync, getSyncPhase, () => 'local' as SyncPhase)
  return (
    <p className={`sync sync-${phase}`} title={LABEL[phase]}>
      <span className="sync-dot" aria-hidden="true" />
      <span className="sync-label">{LABEL[phase]}</span>
    </p>
  )
}
