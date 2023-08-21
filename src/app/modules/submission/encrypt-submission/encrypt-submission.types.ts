import {
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import { IPopulatedEncryptedForm } from '../../../../types'
import {
  EncryptSubmissionBodyWithContextDto,
  EncryptSubmissionDto,
  FormsgContentOptionalSubmissionDto,
  ParsedStorageModeSubmissionBody,
  StorageModeSubmissionBodyWithContextDto,
} from '../../../../types/api'
import { ControllerHandler } from '../../core/core.types'

export type AttachmentMetadata = Map<string, string>

export type SaveEncryptSubmissionParams = {
  form: IPopulatedEncryptedForm
  encryptedContent: string
  version: number
  verifiedContent?: string
  attachmentMetadata?: Map<string, string>
}

export type createFormsgAndRetrieveFormMiddlewareHandlerType =
  ControllerHandler<
    { formId: string },
    SubmissionResponseDto | SubmissionErrorDto,
    (ParsedStorageModeSubmissionBody | EncryptSubmissionDto) &
      FormsgContentOptionalSubmissionDto,
    { captchaResponse?: unknown; captchaType?: unknown }
  >

export type StorageSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  StorageModeSubmissionBodyWithContextDto,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type EncryptSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  EncryptSubmissionBodyWithContextDto,
  { captchaResponse?: unknown; captchaType?: unknown }
>
