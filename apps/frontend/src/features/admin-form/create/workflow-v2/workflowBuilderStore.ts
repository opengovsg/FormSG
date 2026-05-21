import create from 'zustand'
import { devtools } from 'zustand/middleware'

import {
  DEFAULT_FIELDS,
  DEFAULT_NOTIFICATION_RECIPIENT_IDS,
  DEFAULT_RESPONDENTS,
  DEFAULT_STEPS,
} from './mockData'
import type {
  FocusState,
  FormField,
  Phase,
  PhaseStatus,
  Respondent,
  WorkflowStep,
  WorkflowStore,
} from './types'

const STORAGE_KEY = 'mrf_workflow_state'

// Shape of data that gets persisted to localStorage
type PersistedState = {
  steps: WorkflowStep[]
  respondents: Respondent[]
  fields: FormField[]
  statusTrackingEnabled: boolean
  progressCardExpanded: boolean
  notificationRecipientIds: string[]
  notificationLabel: string
}

const DEFAULT_PERSISTED: PersistedState = {
  steps: DEFAULT_STEPS,
  respondents: DEFAULT_RESPONDENTS,
  fields: DEFAULT_FIELDS,
  statusTrackingEnabled: false,
  progressCardExpanded: false,
  notificationRecipientIds: DEFAULT_NOTIFICATION_RECIPIENT_IDS,
  notificationLabel: 'Receive final email notification',
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PERSISTED
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    // Merge with defaults so new fields added in later sprints get their defaults
    return { ...DEFAULT_PERSISTED, ...parsed }
  } catch {
    return DEFAULT_PERSISTED
  }
}

// Debounced persistence
let persistTimeout: ReturnType<typeof setTimeout> | null = null
function persistState(state: PersistedState) {
  if (persistTimeout) clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // localStorage full or unavailable - silently skip
    }
  }, 500)
}

// Selectors
export const stepsSelector = (state: WorkflowStore) => state.steps
export const respondentsSelector = (state: WorkflowStore) => state.respondents
export const fieldsSelector = (state: WorkflowStore) => state.fields
export const focusStateSelector = (state: WorkflowStore) => state.focusState
export const setFocusSelector = (state: WorkflowStore) => state.setFocus
export const progressCardExpandedSelector = (state: WorkflowStore) =>
  state.progressCardExpanded
export const pendingInsertIndexSelector = (state: WorkflowStore) =>
  state.pendingInsertIndex
export const previewStepNameSelector = (state: WorkflowStore) =>
  state.previewStepName
export const notificationRecipientIdsSelector = (state: WorkflowStore) =>
  state.notificationRecipientIds
export const pendingFieldSelectionSelector = (state: WorkflowStore) =>
  state.pendingFieldSelection
export const notificationLabelSelector = (state: WorkflowStore) =>
  state.notificationLabel

export function completedPhases(state: WorkflowStore): Phase[] {
  const completed: Phase[] = []
  const { steps, fields } = state

  // add_steps: done if more than 1 step
  if (steps.length > 1) completed.push('add_steps')

  // add_respondents: done if every step has at least one respondent
  if (steps.length > 1 && steps.every((s) => s.respondentIds.length > 0)) {
    completed.push('add_respondents')
  }

  // create_fields: done if there are fields
  if (fields.length > 0) completed.push('create_fields')

  // assign_fields: done if every step has at least one field
  if (
    steps.length > 1 &&
    steps.every((s) => s.fieldIds.length > 0 || s.approvalFieldIds.length > 0)
  ) {
    completed.push('assign_fields')
  }

  return completed
}

export function phaseStatus(state: WorkflowStore, phase: Phase): PhaseStatus {
  const done = completedPhases(state)
  if (done.includes(phase)) return 'done'

  // A phase is "in progress" if the phase before it is done (or it's the first phase)
  const order: Phase[] = [
    'add_steps',
    'add_respondents',
    'create_fields',
    'assign_fields',
  ]
  const idx = order.indexOf(phase)
  if (idx === 0) return 'in_progress'
  if (done.includes(order[idx - 1])) return 'in_progress'

  return 'not_started'
}

function recalculateOrder(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s, i) => ({ ...s, order: i }))
}

/**
 * Update "Step N:" prefix in step names to match their actual position.
 * If a name starts with "Step <number>:", replace with the correct number.
 * If it doesn't have a prefix, leave it as-is.
 */
function renumberStepNames(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s, i) => {
    const prefixMatch = s.name.match(/^Step \d+: /)
    if (prefixMatch) {
      return {
        ...s,
        name: `Step ${i + 1}: ${s.name.slice(prefixMatch[0].length)}`,
      }
    }
    return s
  })
}

const initialPersisted = loadPersistedState()

export const useWorkflowBuilderStore = create<WorkflowStore>()(
  devtools((set) => ({
    // Persisted data
    steps: initialPersisted.steps,
    respondents: initialPersisted.respondents,
    fields: initialPersisted.fields,
    statusTrackingEnabled: initialPersisted.statusTrackingEnabled,
    progressCardExpanded: initialPersisted.progressCardExpanded,
    notificationRecipientIds: initialPersisted.notificationRecipientIds,
    notificationLabel: initialPersisted.notificationLabel,

    // UI state
    focusState: { type: 'summary' } as FocusState,
    pendingInsertIndex: null,
    previewStepName: null,
    pendingFieldSelection: null,
    deletingRespondentId: null,

    // Sprint 1 actions
    setFocus: (focusState) => set({ focusState }),
    setPendingInsertIndex: (index) => set({ pendingInsertIndex: index }),
    setPreviewStepName: (name) => set({ previewStepName: name }),

    toggleProgressCard: () =>
      set((state) => ({
        progressCardExpanded: !state.progressCardExpanded,
      })),

    resetWorkflow: () =>
      set({
        ...DEFAULT_PERSISTED,
        focusState: { type: 'summary' } as FocusState,
      }),

    // Sprint 2 actions
    addStep: (type, name, insertIndex) =>
      set((state) => {
        const newStep: WorkflowStep = {
          id: `step-${Date.now()}`,
          type,
          name,
          order: 0,
          respondentIds: [],
          fieldIds: [],
          approvalFieldIds: [],
        }
        const next = [...state.steps]
        next.splice(insertIndex, 0, newStep)
        return { steps: renumberStepNames(recalculateOrder(next)) }
      }),

    removeStep: (stepId) =>
      set((state) => {
        const next = state.steps.filter((s) => s.id !== stepId)
        const focusState =
          state.focusState.type === 'step_focus' &&
          state.focusState.stepId === stepId
            ? ({ type: 'phase', phase: 'add_steps' } as FocusState)
            : state.focusState
        return { steps: renumberStepNames(recalculateOrder(next)), focusState }
      }),

    renameStep: (stepId, name) =>
      set((state) => ({
        steps: state.steps.map((s) => (s.id === stepId ? { ...s, name } : s)),
      })),

    reorderSteps: (fromIndex, toIndex) =>
      set((state) => {
        const next = [...state.steps]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return { steps: renumberStepNames(recalculateOrder(next)) }
      }),

    toggleStatusTracking: () =>
      set((state) => ({
        statusTrackingEnabled: !state.statusTrackingEnabled,
      })),

    // Sprint 3 actions
    assignRespondent: (stepId, respondentId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId && !s.respondentIds.includes(respondentId)
            ? { ...s, respondentIds: [...s.respondentIds, respondentId] }
            : s,
        ),
      })),

    unassignRespondent: (stepId, respondentId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                respondentIds: s.respondentIds.filter(
                  (id) => id !== respondentId,
                ),
              }
            : s,
        ),
      })),

    addRespondent: (data) =>
      set((state) => ({
        respondents: [
          ...state.respondents,
          { ...data, id: `resp-${Date.now()}` },
        ],
      })),

    updateRespondent: (id, data) =>
      set((state) => ({
        respondents: state.respondents.map((r) =>
          r.id === id ? { ...r, ...data } : r,
        ),
      })),

    assignNotificationRecipient: (respondentId) =>
      set((state) => ({
        notificationRecipientIds: state.notificationRecipientIds.includes(
          respondentId,
        )
          ? state.notificationRecipientIds
          : [...state.notificationRecipientIds, respondentId],
      })),

    unassignNotificationRecipient: (respondentId) =>
      set((state) => ({
        notificationRecipientIds: state.notificationRecipientIds.filter(
          (id) => id !== respondentId,
        ),
      })),

    removeRespondent: (respondentId) =>
      set((state) => ({
        respondents: state.respondents.filter((r) => r.id !== respondentId),
        steps: state.steps.map((s) => ({
          ...s,
          respondentIds: s.respondentIds.filter((id) => id !== respondentId),
        })),
        notificationRecipientIds: state.notificationRecipientIds.filter(
          (id) => id !== respondentId,
        ),
      })),

    renameNotificationLabel: (name) => set({ notificationLabel: name }),

    // Sprint 3b actions
    addField: (data) =>
      set((state) => ({
        fields: [
          ...state.fields,
          {
            ...data,
            id: `field-${Date.now()}`,
            number: state.fields.length + 1,
          },
        ],
      })),

    setPendingFieldSelection: (id) => set({ pendingFieldSelection: id }),

    syncFields: (fields) => set({ fields }),

    // Sprint 4 actions
    assignField: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                fieldIds: s.fieldIds.includes(fieldId)
                  ? s.fieldIds
                  : [...s.fieldIds, fieldId],
                approvalFieldIds: s.approvalFieldIds.filter(
                  (id) => id !== fieldId,
                ),
              }
            : s,
        ),
      })),

    unassignField: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? { ...s, fieldIds: s.fieldIds.filter((id) => id !== fieldId) }
            : s,
        ),
      })),

    assignApprovalField: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                approvalFieldIds: s.approvalFieldIds.includes(fieldId)
                  ? s.approvalFieldIds
                  : [...s.approvalFieldIds, fieldId],
                fieldIds: s.fieldIds.filter((id) => id !== fieldId),
              }
            : s,
        ),
      })),

    unassignApprovalField: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                approvalFieldIds: s.approvalFieldIds.filter(
                  (id) => id !== fieldId,
                ),
              }
            : s,
        ),
      })),

    assignAllFields: (stepId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? { ...s, fieldIds: state.fields.map((f) => f.id) }
            : s,
        ),
      })),

    unassignAllFields: (stepId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId ? { ...s, fieldIds: [] } : s,
        ),
      })),
  })),
)

// Subscribe to state changes and persist
useWorkflowBuilderStore.subscribe((state) => {
  persistState({
    steps: state.steps,
    respondents: state.respondents,
    fields: state.fields,
    statusTrackingEnabled: state.statusTrackingEnabled,
    progressCardExpanded: state.progressCardExpanded,
    notificationRecipientIds: state.notificationRecipientIds,
    notificationLabel: state.notificationLabel,
  })
})
