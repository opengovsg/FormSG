import { FormAuthType } from 'formsg-shared/types'

// Binds a later-step MRF login to one submission and step
export type MrfStepAuthContext = {
  formId: string
  submissionId: string
  // Zero-indexed
  workflowStep: number
  // Absent for legacy submissions without a step token
  stepTokenHash?: string
  authType: FormAuthType.MyInfo | FormAuthType.CP
}
