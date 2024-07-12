import {
  MyInfoAttribute,
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import { IPopulatedEncryptedForm } from '../../../../types'
import {
  EncryptFormLoadedDto,
  EncryptSubmissionDto,
  FormCompleteDto,
  FormFilteredResponseDto,
  ParsedStorageModeSubmissionBody,
} from '../../../../types/api'
import { ControllerHandler } from '../../core/core.types'
import { ProcessedFieldResponse } from '../submission.types'

export type SaveEncryptSubmissionParams = {
  form: IPopulatedEncryptedForm
  encryptedContent: string
  version: number
  verifiedContent?: string
  attachmentMetadata?: Map<string, string>
}

export type CreateFormsgAndRetrieveFormMiddlewareHandlerType =
  ControllerHandler<
    { formId: string },
    SubmissionResponseDto | SubmissionErrorDto,
    ParsedStorageModeSubmissionBody | EncryptSubmissionDto,
    { captchaResponse?: unknown; captchaType?: unknown }
  >

export type CreateFormsgAndRetrieveFormMiddlewareHandlerRequest =
  Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[0] & {
    formsg?: EncryptFormLoadedDto
  }

export type StorageSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  ParsedStorageModeSubmissionBody,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type StorageSubmissionMiddlewareHandlerRequest =
  Parameters<StorageSubmissionMiddlewareHandlerType>[0] & {
    formsg: FormCompleteDto
  }

export type ValidateSubmissionMiddlewareHandlerRequest =
  Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[0] & {
    formsg: FormFilteredResponseDto
  }

export type EncryptSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  EncryptSubmissionDto,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type EncryptSubmissionMiddlewareHandlerRequest =
  Parameters<EncryptSubmissionMiddlewareHandlerType>[0] & {
    formsg: FormCompleteDto
  }

export type SubmitEncryptModeFormHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto
>

export type SubmitEncryptModeFormHandlerRequest =
  Parameters<SubmitEncryptModeFormHandlerType>[0] & {
    formsg: FormCompleteDto
    body: {
      responses: ProcessedFieldResponse[]
    }
  }

export type EncryptSubmissionContent = {
  form: IPopulatedEncryptedForm['_id']
  authType: IPopulatedEncryptedForm['authType']
  submitterId?: string
  myInfoFields: MyInfoAttribute[]
  encryptedContent: string
  verifiedContent: string | undefined
  attachmentMetadata: Map<string, string>
  version: number
  responseMetadata: EncryptSubmissionDto['responseMetadata']
}
