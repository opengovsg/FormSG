import { IPopulatedMultirespondentForm } from 'src/types'

import {
  AttachmentResponseV3,
  MyInfoAttribute,
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import {
  MultirespondentFormCompleteDto,
  MultirespondentFormLoadedDto,
  ParsedClearFormFieldResponsesV3,
  ParsedMultirespondentSubmissionBody,
} from '../../../../types/api'
import { ControllerHandler } from '../../core/core.types'

export type CreateFormsgAndRetrieveFormMiddlewareHandlerType =
  ControllerHandler<
    { formId: string },
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
    responses: ParsedClearFormFieldResponsesV3
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
  attachmentMetadata: Map<string, string>
  version: number
  workflowStep: number
  mrfVersion: number
}

export type StrippedAttachmentResponseV3 = AttachmentResponseV3 & {
  answer: AttachmentResponseV3['answer'] & {
    filename: undefined
    content: undefined
  }
}
