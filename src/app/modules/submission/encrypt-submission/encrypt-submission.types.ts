import { PresignedPost } from 'aws-sdk/clients/s3'
import { ObjectId } from 'mongodb'

import {
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import { IPopulatedEncryptedForm } from '../../../../types'
import {
  EncryptSubmissionDto,
  FormLoadedDto,
  FormsgCompleteDto,
  ParsedStorageModeSubmissionBody,
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

export type CreateFormsgAndRetrieveFormMiddlewareHandlerType =
  ControllerHandler<
    { formId: string },
    SubmissionResponseDto | SubmissionErrorDto,
    ParsedStorageModeSubmissionBody | EncryptSubmissionDto,
    { captchaResponse?: unknown; captchaType?: unknown }
  >

export type CreateFormsgAndRetrieveFormMiddlewareHandlerRequest =
  Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[0] & {
    formsg?: FormLoadedDto
  }

export type StorageSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  ParsedStorageModeSubmissionBody,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type StorageSubmissionMiddlewareHandlerRequest =
  Parameters<StorageSubmissionMiddlewareHandlerType>[0] & {
    formsg: FormLoadedDto
  }

export type EncryptSubmissionMiddlewareHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  EncryptSubmissionDto,
  { captchaResponse?: unknown; captchaType?: unknown }
>

export type EncryptSubmissionMiddlewareHandlerRequest =
  Parameters<EncryptSubmissionMiddlewareHandlerType>[0] & FormsgCompleteDto

export type SubmitEncryptModeFormHandlerType = ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto
>

export type SubmitEncryptModeFormHandlerRequest =
  Parameters<SubmitEncryptModeFormHandlerType>[0] & FormsgCompleteDto

export type AttachmentSizeMapType = {
  id: ObjectId
  size: number
}

export type AttachmentPresignedPostDataMapType = {
  id: ObjectId
  presignedPostData: PresignedPost
}
