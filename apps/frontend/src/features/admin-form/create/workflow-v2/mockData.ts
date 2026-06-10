import type { FormField, Respondent, WorkflowStep } from './types'

// System respondents (always available)
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

// Empty defaults: no pre-populated data. User creates workflow from scratch.
export const DEFAULT_FIELDS: FormField[] = []
export const DEFAULT_NOTIFICATION_RECIPIENT_IDS: string[] = [
  'resp-collaborator',
]
export const DEFAULT_STEPS: WorkflowStep[] = []
