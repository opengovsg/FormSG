import type { FormFieldDto } from '../field'

import type { FormAuthType, PublicFormViewDto } from './form'

export type PublicFormAuthRedirectDto = { redirectURL: string }

export type PublicFormAuthLogoutDto = { message: string }

// Body for a later MRF step's login endpoints. The step token never goes in a URL.
export type MrfStepAuthRequestDto = { stepToken?: string }

export type MrfStepAuthRedirectRequestDto = MrfStepAuthRequestDto & {
  encodedQuery?: string
}

/**
 * Login requirement and session for the pending step of an MRF submission.
 * Prefills are only present once the respondent has logged in for this step.
 */
export type MrfStepAuthSessionDto = {
  // Zero-indexed
  workflowStep: number
  // NIL when the step has no login
  authType: FormAuthType
  // This step's fields only. Login-filled identities are always included,
  // MyInfo profile values only right after a MyInfo login.
  prefilledFields?: FormFieldDto[]
} & Pick<
  PublicFormViewDto,
  'spcpSession' | 'myInfoChildrenBirthRecords' | 'errorCodes'
>
