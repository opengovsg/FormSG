// Step types
export type StepType = 'collect' | 'review'

export type WorkflowStep = {
  id: string
  type: StepType
  name: string
  isCustomName: boolean
  order: number
  respondentIds: string[]
  fieldIds: string[]
  approvalDecisionFieldId: string | null // review steps only
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
  optionsToRecipientsMap?: Record<string, string[]>
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
  options?: string[] // dropdown field options
}

// Legacy types (kept for backwards compat with creation flow and settings)
export type Phase =
  | 'add_steps'
  | 'add_respondents'
  | 'create_fields'
  | 'assign_fields'

export type PhaseStatus = 'not_started' | 'in_progress' | 'done'

export const PHASE_ORDER: Phase[] = [
  'add_steps',
  'add_respondents',
  'create_fields',
  'assign_fields',
]

// Step colours as hex (fallback)
export const STEP_COLOURS_HEX = [
  '#4A61C0', // Blue (form theme)
  '#357867', // Green
  '#F66F23', // Orange
  '#DC2A2A', // Red
  '#7F6F5E', // Brown
  '#495C66', // Grey
] as const

// Keep old name as alias for any existing consumers
export const STEP_COLOURS = STEP_COLOURS_HEX

// Theme color names for steps (Chakra token prefix, e.g. 'theme-blue.500')
export const STEP_COLOUR_THEMES = [
  'theme-blue',
  'theme-green',
  'theme-orange',
  'theme-red',
  'theme-brown',
  'theme-grey',
] as const

// Given the form's color theme, return ordered step colour themes.
// Step 1 uses the form theme; remaining steps use the rest in order.
export function getStepColourThemes(formColorTheme?: string): string[] {
  const formTheme = formColorTheme ? `theme-${formColorTheme}` : 'theme-blue'
  const others = STEP_COLOUR_THEMES.filter((t) => t !== formTheme)
  return [formTheme, ...others]
}

// Focus state for form-as-canvas (simplified from wizard phases)
export type FocusState =
  | { type: 'default' }
  | { type: 'step_edit'; stepId: string }

// Store interface
export type WorkflowStore = {
  // Data (persisted to localStorage)
  steps: WorkflowStep[]
  respondents: Respondent[]
  fields: FormField[]
  statusTrackingEnabled: boolean
  notificationRecipientIds: string[]
  notificationLabel: string

  // UI state (not persisted)
  focusState: FocusState

  // Actions - Navigation
  setFocus: (state: FocusState) => void
  resetWorkflow: () => void

  // Actions - Workflow lifecycle
  createWorkflow: () => void // Creates Step 1 with defaults, assigns all fields
  hasWorkflow: () => boolean

  // Actions - Steps
  addStep: (type: StepType, name: string, insertIndex: number) => void
  removeStep: (stepId: string) => void
  renameStep: (stepId: string, name: string) => void
  reorderSteps: (fromIndex: number, toIndex: number) => void
  setStepType: (stepId: string, type: StepType) => void
  toggleStatusTracking: () => void

  // Actions - Respondents
  assignRespondent: (stepId: string, respondentId: string) => void
  unassignRespondent: (stepId: string, respondentId: string) => void
  addRespondent: (data: Omit<Respondent, 'id'>) => void
  updateRespondent: (id: string, data: Partial<Omit<Respondent, 'id'>>) => void
  assignNotificationRecipient: (respondentId: string) => void
  unassignNotificationRecipient: (respondentId: string) => void
  removeRespondent: (respondentId: string) => void
  renameNotificationLabel: (name: string) => void

  // Actions - Fields
  addField: (data: Omit<FormField, 'id' | 'number'>) => void
  syncFields: (fields: FormField[]) => void
  toggleFieldAssignment: (stepId: string, fieldId: string) => void
  assignField: (stepId: string, fieldId: string) => void
  unassignField: (stepId: string, fieldId: string) => void
  assignAllFields: (stepId: string) => void
  unassignAllFields: (stepId: string) => void

  // Actions - Approval
  setApprovalDecisionField: (stepId: string, fieldId: string | null) => void

  // Actions - Store scoping
  loadForForm: (formId: string, initialFocus?: FocusState) => void
}
