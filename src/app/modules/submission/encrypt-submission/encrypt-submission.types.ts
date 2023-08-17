import {
  StorageModeAttachmentsMap,
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import { IPopulatedEncryptedForm } from '../../../../types'
import {
  EncryptSubmissionDtoWithContext,
  StorageModeSubmissionBodyWithContext,
} from '../../../../types/api'
import { ControllerHandler } from '../../core/core.types'
import { ProcessedFieldResponse } from '../submission.types'

export type EncryptSubmissionBodyAfterProcess = {
  encryptedContent: string
  attachments?: StorageModeAttachmentsMap
  isPreview: boolean
  version: number
  parsedResponses: ProcessedFieldResponse[]
}

export type AttachmentMetadata = Map<string, string>

export type SaveEncryptSubmissionParams = {
  form: IPopulatedEncryptedForm
  encryptedContent: string
  version: number
  verifiedContent?: string
  attachmentMetadata?: Map<string, string>
}

export type SharedSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  StorageModeSubmissionBodyWithContext | EncryptSubmissionDtoWithContext,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type EncryptSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  EncryptSubmissionDtoWithContext,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type StorageSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  StorageModeSubmissionBodyWithContext,
  { captchaResponse?: unknown; captchaType?: unknown }
>
