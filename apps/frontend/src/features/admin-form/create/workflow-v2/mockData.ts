import type { FormField, Respondent, WorkflowStep } from './types'

export const DEFAULT_RESPONDENTS: Respondent[] = [
  {
    id: 'resp-form-link',
    name: 'Anyone with the form link',
    type: 'form_link',
    description:
      'Anyone who receives the form URL will get access to this step. Other steps are accessed via unique links sent by email.',
    isCustom: false,
  },
  {
    id: 'resp-collaborator',
    name: 'Collaborators on this form',
    type: 'collaborator',
    description:
      'People added as collaborators can fill in or receive notifications',
    isCustom: false,
  },
]

// Fields for the Crew Change form. These get loaded when the user
// has created fields in the form builder (not on first visit).
export const CREW_CHANGE_FIELDS: FormField[] = [
  {
    id: 'field-1',
    name: 'Crew member name',
    fieldType: 'short_text',
    number: 1,
  },
  { id: 'field-2', name: 'Crew member email', fieldType: 'email', number: 2 },
  { id: 'field-3', name: 'Back-up email', fieldType: 'email', number: 3 },
  { id: 'field-4', name: 'Manager email', fieldType: 'short_text', number: 4 },
  { id: 'field-5', name: 'Approve request', fieldType: 'yes_no', number: 5 },
]

// Default: no fields yet (form just created)
export const DEFAULT_FIELDS: FormField[] = []

// Default notification recipients: collaborators get notified
export const DEFAULT_NOTIFICATION_RECIPIENT_IDS: string[] = [
  'resp-collaborator',
]

export const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: 'step-1',
    type: 'collect',
    name: 'Step 1',
    isCustomName: false,
    order: 0,
    respondentIds: ['resp-form-link'],
    fieldIds: [],
    approvalFieldIds: [],
  },
]
