import type { AttachmentAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  MyInfoAttribute,
  SubmissionErrorDto,
  SubmissionResponseDto,
  SubmittedStep,
} from 'formsg-shared/types'

import { IPopulatedMultirespondentForm } from 'src/types'

import {
  MultirespondentFormCompleteDto,
  MultirespondentFormLoadedDto,
  ParsedClearAttachmentFieldResponseV4,
  ParsedClearFormFieldResponsesV4,
  ParsedMultirespondentSubmissionBody,
} from '../../../../types/api'
import { ControllerHandler } from '../../core/core.types'

export type CreateFormsgAndRetrieveFormMiddlewareHandlerType =
  ControllerHandler<
    { formId: string; submissionId?: string },
    SubmissionResponseDto | SubmissionErrorDto,
    ParsedMultirespondentSubmissionBody,
    { captchaResponse?: unknown; captchaType?: unknown }
  >

export type CreateFormsgAndRetrieveFormMiddlewareHandlerRequest =
  Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[0] & {
    formsg?: MultirespondentFormLoadedDto
  }

export type MultirespondentSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  ParsedMultirespondentSubmissionBody,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type MultirespondentSubmissionMiddlewareHandlerRequest =
  Parameters<MultirespondentSubmissionMiddlewareHandlerType>[0] & {
    formsg: MultirespondentFormCompleteDto
  }

export type ProcessedMultirespondentSubmissionHandlerType = ControllerHandler<
  { formId: string; submissionId?: string },
  SubmissionResponseDto | SubmissionErrorDto,
  Omit<ParsedMultirespondentSubmissionBody, 'responses'> & {
    submissionSecretKey?: string
    stepToken?: string
    responses: ParsedClearFormFieldResponsesV4
  },
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type ProcessedMultirespondentSubmissionHandlerRequest =
  Parameters<ProcessedMultirespondentSubmissionHandlerType>[0] & {
    formsg: MultirespondentFormCompleteDto
  }

export type SubmitMultirespondentFormHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto
>

export type SubmitMultirespondentFormHandlerRequest =
  Parameters<SubmitMultirespondentFormHandlerType>[0] & {
    formsg: MultirespondentFormCompleteDto
  }

export type UpdateMultirespondentSubmissionHandlerType = ControllerHandler<
  { formId: string; submissionId: string },
  SubmissionResponseDto | SubmissionErrorDto
>

export type UpdateMultirespondentSubmissionHandlerRequest =
  Parameters<UpdateMultirespondentSubmissionHandlerType>[0] & {
    formsg: MultirespondentFormCompleteDto
  }

export type MultirespondentSubmissionContent = {
  form: IPopulatedMultirespondentForm['_id']
  authType: IPopulatedMultirespondentForm['authType']
  myInfoFields: MyInfoAttribute[]
  form_fields: IPopulatedMultirespondentForm['form_fields']
  form_logics: IPopulatedMultirespondentForm['form_logics']
  workflow: IPopulatedMultirespondentForm['workflow']
  submissionPublicKey: string
  encryptedSubmissionSecretKey: string
  encryptedContent: string
  verifiedContent: string | undefined
  attachmentMetadata: Map<string, string>
  version: number
  workflowStep: number
  mrfVersion: number
  submittedSteps: SubmittedStep[]
  // RATIONALE: optional for backwards compatibility on
  // in-flight mrf steps which do not have a step token at time of creation.
  stepTokenHash?: string
  encryptedStepToken?: string
  // Only present on payment-enabled (necessarily zero-step) forms.
  paymentId?: string
}

export type StrippedAttachmentResponseV4 = Omit<
  ParsedClearAttachmentFieldResponseV4,
  'answer'
> & {
  answer: AttachmentAnswerV4 & {
    filename: undefined
    content: undefined
  }
}

export type MrfJwtPayload = {
  prevSubmissionId: string
  currentWorkflowStep: number
}
