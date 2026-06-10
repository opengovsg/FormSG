import create from 'zustand'
import { devtools } from 'zustand/middleware'

import {
  DEFAULT_FIELDS,
  DEFAULT_NOTIFICATION_RECIPIENT_IDS,
  DEFAULT_RESPONDENTS,
  DEFAULT_STEPS,
} from './mockData'
import {
  type FocusState,
  type FormField,
  type Respondent,
  type WorkflowStep,
  type WorkflowStore,
} from './types'

const STORAGE_KEY_PREFIX = 'mrf_workflow_state_'

// Shape of data that gets persisted to localStorage
type PersistedState = {
  steps: WorkflowStep[]
  respondents: Respondent[]
  fields: FormField[]
  statusTrackingEnabled: boolean
  notificationRecipientIds: string[]
  notificationLabel: string
}

const DEFAULT_PERSISTED: PersistedState = {
  steps: DEFAULT_STEPS,
  respondents: DEFAULT_RESPONDENTS,
  fields: DEFAULT_FIELDS,
  statusTrackingEnabled: false,
  notificationRecipientIds: DEFAULT_NOTIFICATION_RECIPIENT_IDS,
  notificationLabel: 'Receive final email notification',
}

// Track which formId is currently loaded so we persist to the right key
let currentFormId: string | null = null

function storageKeyFor(formId: string): string {
  return `${STORAGE_KEY_PREFIX}${formId}`
}

function loadPersistedState(formId?: string): PersistedState {
  try {
    const key = formId ? storageKeyFor(formId) : null
    const raw = key ? localStorage.getItem(key) : null

    if (!raw) return DEFAULT_PERSISTED
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const merged = { ...DEFAULT_PERSISTED, ...parsed }
    // Migration: add isCustomName to steps that don't have it
    merged.steps = merged.steps.map((s) => ({
      ...s,
      isCustomName: s.isCustomName ?? false,
      approvalDecisionFieldId:
        s.approvalDecisionFieldId ??
        (s as unknown as { approvalFieldIds?: string[] })
          .approvalFieldIds?.[0] ??
        null,
    }))
    return merged
  } catch {
    return DEFAULT_PERSISTED
  }
}

// Debounced persistence
let persistTimeout: ReturnType<typeof setTimeout> | null = null
function persistState(state: PersistedState) {
  if (persistTimeout) clearTimeout(persistTimeout)
  if (!currentFormId) return
  const key = storageKeyFor(currentFormId)
  persistTimeout = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
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
export const notificationRecipientIdsSelector = (state: WorkflowStore) =>
  state.notificationRecipientIds
export const notificationLabelSelector = (state: WorkflowStore) =>
  state.notificationLabel

// Legacy selectors (kept for backwards compat with creation flow)
export const pendingInsertIndexSelector = () => null
export const previewStepNameSelector = () => null
export const progressCardExpandedSelector = () => false
export const justDraggedIdSelector = () => null

// Legacy phase status helper (kept for backwards compat)
export function phaseStatus(): string {
  return 'not_started'
}

// Workflow readiness check (used by Settings and Build tab)
export function completedPhases(state: WorkflowStore): string[] {
  const completed: string[] = []
  const { steps, fields } = state

  if (steps.length > 1) completed.push('add_steps')
  if (steps.length > 1 && steps.every((s) => s.respondentIds.length > 0)) {
    completed.push('add_respondents')
  }
  if (fields.length > 0) completed.push('create_fields')
  if (
    steps.length > 1 &&
    steps.every(
      (s) =>
        s.fieldIds.length > 0 &&
        (s.type !== 'review' || s.approvalDecisionFieldId !== null),
    )
  ) {
    completed.push('assign_fields')
  }

  return completed
}

function recalculateOrder(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s, i) => ({ ...s, order: i }))
}

/**
 * Update step names to match their actual position.
 * Only updates steps where isCustomName is false.
 */
function renumberStepNames(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s, i) => {
    if (!s.isCustomName) {
      return { ...s, name: `Step ${i + 1}` }
    }
    return s
  })
}

export const useWorkflowBuilderStore = create<WorkflowStore>()(
  devtools((set) => ({
    // Persisted data
    steps: DEFAULT_PERSISTED.steps,
    respondents: DEFAULT_PERSISTED.respondents,
    fields: DEFAULT_PERSISTED.fields,
    statusTrackingEnabled: DEFAULT_PERSISTED.statusTrackingEnabled,
    notificationRecipientIds: DEFAULT_PERSISTED.notificationRecipientIds,
    notificationLabel: DEFAULT_PERSISTED.notificationLabel,

    // UI state
    focusState: { type: 'default' } as FocusState,

    // Navigation
    setFocus: (focusState) => set({ focusState }),

    resetWorkflow: () =>
      set({
        ...DEFAULT_PERSISTED,
        focusState: { type: 'default' } as FocusState,
      }),

    // Workflow lifecycle
    createWorkflow: () =>
      set((state) => {
        // Create Step 1 with all current fields assigned
        const step1: WorkflowStep = {
          id: `step-${Date.now()}`,
          type: 'collect',
          name: 'Step 1',
          isCustomName: false,
          order: 0,
          respondentIds: ['resp-form-link'],
          fieldIds: state.fields.map((f) => f.id),
          approvalDecisionFieldId: null,
        }
        return { steps: [step1] }
      }),

    hasWorkflow: () => useWorkflowBuilderStore.getState().steps.length > 0,

    // Step actions
    addStep: (type, name, insertIndex) =>
      set((state) => {
        const defaultName = `Step ${insertIndex + 1}`
        const newStep: WorkflowStep = {
          id: `step-${Date.now()}`,
          type,
          name,
          isCustomName: name !== defaultName,
          order: 0,
          respondentIds: [],
          fieldIds: [],
          approvalDecisionFieldId: null,
        }
        const next = [...state.steps]
        next.splice(insertIndex, 0, newStep)
        return { steps: renumberStepNames(recalculateOrder(next)) }
      }),

    removeStep: (stepId) =>
      set((state) => {
        const next = state.steps.filter((s) => s.id !== stepId)
        // If we were editing this step, go back to default
        const focusState =
          state.focusState.type === 'step_edit' &&
          state.focusState.stepId === stepId
            ? ({ type: 'default' } as FocusState)
            : state.focusState
        return { steps: renumberStepNames(recalculateOrder(next)), focusState }
      }),

    renameStep: (stepId, name) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId ? { ...s, name, isCustomName: true } : s,
        ),
      })),

    reorderSteps: (fromIndex, toIndex) =>
      set((state) => {
        const next = [...state.steps]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return { steps: renumberStepNames(recalculateOrder(next)) }
      }),

    setStepType: (stepId, type) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId ? { ...s, type, approvalDecisionFieldId: null } : s,
        ),
      })),

    toggleStatusTracking: () =>
      set((state) => ({
        statusTrackingEnabled: !state.statusTrackingEnabled,
      })),

    // Respondent actions
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

    // Field actions
    addField: (data) =>
      set((state) => {
        const newField = {
          ...data,
          id: `field-${Date.now()}`,
          number: state.fields.length + 1,
        }
        // Auto-assign new fields to Step 1 (sprint 15 design decision)
        const step1 = state.steps[0]
        const updatedSteps = step1
          ? state.steps.map((s) =>
              s.id === step1.id
                ? { ...s, fieldIds: [...s.fieldIds, newField.id] }
                : s,
            )
          : state.steps
        return {
          fields: [...state.fields, newField],
          steps: updatedSteps,
        }
      }),

    syncFields: (fields) => set({ fields }),

    toggleFieldAssignment: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) => {
          if (s.id !== stepId) return s
          const isAssigned = s.fieldIds.includes(fieldId)
          return {
            ...s,
            fieldIds: isAssigned
              ? s.fieldIds.filter((id) => id !== fieldId)
              : [...s.fieldIds, fieldId],
            // Clear approval field if unassigning it
            approvalDecisionFieldId:
              isAssigned && s.approvalDecisionFieldId === fieldId
                ? null
                : s.approvalDecisionFieldId,
          }
        }),
      })),

    assignField: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                fieldIds: s.fieldIds.includes(fieldId)
                  ? s.fieldIds
                  : [...s.fieldIds, fieldId],
              }
            : s,
        ),
      })),

    unassignField: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                fieldIds: s.fieldIds.filter((id) => id !== fieldId),
                approvalDecisionFieldId:
                  s.approvalDecisionFieldId === fieldId
                    ? null
                    : s.approvalDecisionFieldId,
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

    // Approval
    setApprovalDecisionField: (stepId, fieldId) =>
      set((state) => ({
        steps: state.steps.map((s) =>
          s.id === stepId ? { ...s, approvalDecisionFieldId: fieldId } : s,
        ),
      })),

    // Store scoping
    loadForForm: (formId, initialFocus?) => {
      if (currentFormId === formId) return
      currentFormId = formId
      const persisted = loadPersistedState(formId)
      set({
        ...persisted,
        focusState: initialFocus ?? ({ type: 'default' } as FocusState),
      })
    },
  })),
)

// Subscribe to state changes and persist
useWorkflowBuilderStore.subscribe((state) => {
  persistState({
    steps: state.steps,
    respondents: state.respondents,
    fields: state.fields,
    statusTrackingEnabled: state.statusTrackingEnabled,
    notificationRecipientIds: state.notificationRecipientIds,
    notificationLabel: state.notificationLabel,
  })
})
