// Step types
export type StepType = 'collect' | 'review'

export type WorkflowStep = {
  id: string
  type: StepType
  name: string
  order: number
  respondentIds: string[]
  fieldIds: string[]
  approvalFieldIds: string[] // review steps only
}

// Respondent types
export type RespondentType =
  | 'form_link'
  | 'collaborator'
  | 'email_field'
  | 'specific_email'
  | 'dropdown_field'

export type Respondent = {
  id: string
  name: string
  type: RespondentType
  description?: string
  email?: string
  linkedFieldId?: string
  isCustom: boolean
}

// Field types
export type FieldType =
  | 'short_text'
  | 'email'
  | 'dropdown'
  | 'date'
  | 'long_text'
  | 'yes_no'

export type FormField = {
  id: string
  name: string
  fieldType: FieldType
  number: number
}

// Phases
export type Phase =
  | 'add_steps'
  | 'add_respondents'
  | 'create_fields'
  | 'assign_fields'

export type PhaseStatus = 'not_started' | 'in_progress' | 'done'

// Focus state (discriminated union)
export type FocusState =
  | { type: 'summary' }
  | { type: 'phase'; phase: Phase }
  | { type: 'step_focus'; phase: Phase; stepId: string }
  | { type: 'step_edit'; stepId: string }
  | { type: 'step_naming'; stepType: StepType; insertIndex: number }
  | { type: 'new_respondent'; fromStepId?: string }
  | { type: 'edit_respondent'; respondentId: string }
  | { type: 'notification_focus' }

// Store interface
export type WorkflowStore = {
  // Data (persisted to localStorage)
  steps: WorkflowStep[]
  respondents: Respondent[]
  fields: FormField[]
  statusTrackingEnabled: boolean
  notificationRecipientIds: string[]

  // UI state (not persisted)
  focusState: FocusState
  progressCardExpanded: boolean
  pendingInsertIndex: number | null
  previewStepName: string | null

  // Actions - Sprint 1
  setFocus: (state: FocusState) => void
  toggleProgressCard: () => void
  resetWorkflow: () => void
  setPendingInsertIndex: (index: number | null) => void
  setPreviewStepName: (name: string | null) => void

  // Actions - Sprint 2
  addStep: (type: StepType, name: string, insertIndex: number) => void
  removeStep: (stepId: string) => void
  renameStep: (stepId: string, name: string) => void
  reorderSteps: (fromIndex: number, toIndex: number) => void
  toggleStatusTracking: () => void

  // Actions - Sprint 3
  assignRespondent: (stepId: string, respondentId: string) => void
  unassignRespondent: (stepId: string, respondentId: string) => void
  addRespondent: (data: Omit<Respondent, 'id'>) => void
  updateRespondent: (id: string, data: Partial<Omit<Respondent, 'id'>>) => void
  assignNotificationRecipient: (respondentId: string) => void
  unassignNotificationRecipient: (respondentId: string) => void

  // Actions - Sprint 4+ stubs
  assignField: (stepId: string, fieldId: string) => void
  assignApprovalField: (stepId: string, fieldId: string) => void
  unassignField: (stepId: string, fieldId: string) => void
  unassignApprovalField: (stepId: string, fieldId: string) => void
  assignAllFields: (stepId: string) => void
  unassignAllFields: (stepId: string) => void
}
