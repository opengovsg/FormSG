import { useMemo, useSyncExternalStore } from 'react'

/**
 * DESIGN PREVIEW ONLY. There is no backend for stops, added assignees or a
 * reminder history yet. They are kept in this browser's localStorage so the
 * drawer, results table, CSV export and status tracking page agree in a demo.
 *
 * TODO(workflow-stop): replace with data persisted on the submission.
 */

const CHANGE_EVENT = 'formsg:workflow-stop-preview-change'

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange)
  // Keeps other tabs in sync, e.g. the public status tracking page.
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

const readRaw = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const parse = <T>(raw: string | null, empty: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : empty
  } catch {
    return empty
  }
}

const createPreviewStore = <T>(name: string, empty: T) => {
  const keyFor = (submissionId: string) =>
    `formsg:workflow-stop-preview:${name}:${submissionId}`

  const get = (submissionId: string): T =>
    parse(readRaw(keyFor(submissionId)), empty)

  const set = (submissionId: string, value: T): void => {
    try {
      window.localStorage.setItem(keyFor(submissionId), JSON.stringify(value))
    } catch {
      // Storage unavailable: the preview simply does not persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  /** Re-renders only when this submission's stored value changes. */
  const useValue = (submissionId: string | undefined): T => {
    const raw = useSyncExternalStore(subscribe, () =>
      submissionId ? readRaw(keyFor(submissionId)) : null,
    )
    return useMemo(() => parse(raw, empty), [raw])
  }

  return { keyPrefix: keyFor(''), get, set, useValue }
}

export interface WorkflowStopRecord {
  /** ISO timestamp of the stop. */
  stoppedAt: string
  /** Actor who stopped it. Not necessarily a form collaborator. */
  stoppedBy: string
  /** Who the stopped email went to. */
  notifiedEmails: string[]
}

export interface WorkflowReminderRecord {
  sentAt: string
  recipients: string[]
  sentBy?: string
}

/** One Reassign action, which can add several people at once. */
export interface WorkflowAssigneeRecord {
  addedAt: string
  emails: string[]
  addedBy?: string
  /** 1-indexed step the assignee was added to. */
  stepNumber: number
}

const stopStore = createPreviewStore<WorkflowStopRecord | null>('stop', null)
const reminderStore = createPreviewStore<WorkflowReminderRecord[]>(
  'reminders',
  [],
)
const assigneeStore = createPreviewStore<WorkflowAssigneeRecord[]>(
  'assignees',
  [],
)

export const getWorkflowStop = stopStore.get
export const useWorkflowStop = stopStore.useValue
export const stopWorkflowPreview = stopStore.set

export const useWorkflowReminders = reminderStore.useValue
export const recordReminderPreview = (
  submissionId: string,
  record: Omit<WorkflowReminderRecord, 'sentAt'>,
) =>
  reminderStore.set(submissionId, [
    ...reminderStore.get(submissionId),
    { ...record, sentAt: new Date().toISOString() },
  ])

export const useWorkflowAssignees = assigneeStore.useValue
export const addAssigneesPreview = (
  submissionId: string,
  emails: string[],
  record: Omit<WorkflowAssigneeRecord, 'addedAt' | 'emails'>,
) =>
  assigneeStore.set(submissionId, [
    ...assigneeStore.get(submissionId),
    { ...record, emails, addedAt: new Date().toISOString() },
  ])

const readStoppedIds = (): string => {
  try {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(stopStore.keyPrefix))
      .map((key) => key.slice(stopStore.keyPrefix.length))
      .sort()
      .join(',')
  } catch {
    return ''
  }
}

/** Every stopped submission id, read once for a whole results table. */
export const useStoppedSubmissionIds = (isEnabled: boolean): Set<string> => {
  const raw = useSyncExternalStore(subscribe, () =>
    isEnabled ? readStoppedIds() : '',
  )
  return useMemo(() => new Set(raw ? raw.split(',') : []), [raw])
}
