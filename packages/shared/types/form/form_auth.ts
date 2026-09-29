import type { FormFieldDto } from '../field'

import type { FormAuthType, PublicFormViewDto } from './form'

export type PublicFormAuthRedirectDto = { redirectURL: string }

export type PublicFormAuthLogoutDto = { message: string }

// Body for the later MRF step login endpoints; the step token never goes in a URL.
export type MrfStepAuthRequestDto = { stepToken?: string }

export type MrfStepAuthRedirectRequestDto = MrfStepAuthRequestDto & {
  encodedQuery?: string
}

/**
 * Login policy and session for the pending step of an MRF submission.
 * Identity and prefill are only present once the respondent has logged in.
 */
export type MrfStepAuthSessionDto = {
  // Zero-indexed
  workflowStep: number
  // NIL when the step has no login
  authType: FormAuthType
  isSubmitterIdCollectionEnabled: boolean
  isWhitelistEnabled: boolean
  // This step's fields only, prefilled right after a MyInfo login
  prefilledFields?: FormFieldDto[]
} & Pick<
  PublicFormViewDto,
  'spcpSession' | 'myInfoChildrenBirthRecords' | 'errorCodes'
>
