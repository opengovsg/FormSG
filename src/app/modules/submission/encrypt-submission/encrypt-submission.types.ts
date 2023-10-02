import { PresignedPost } from 'aws-sdk/clients/s3'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'

import {
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import { hasProp } from '../../../../../shared/utils/has-prop'
import { IPopulatedEncryptedForm } from '../../../../types'
import {
  EncryptSubmissionDto,
  FormCompleteDto,
  FormFilteredResponseDto,
  FormLoadedDto,
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
  Parameters<SubmitEncryptModeFormHandlerType>[0] & { formsg: FormCompleteDto }

export type AttachmentPresignedPostDataMapType = {
  id: ObjectId
  presignedPostData: PresignedPost
}

export type ParseVirusScannerLambdaPayloadBeforeBodyIsParsed = {
  statusCode: number
  body: string
}

export type ParseVirusScannerLambdaPayloadOkBody = {
  cleanFileKey: string
  destinationVersionId: string
}

export type ParseVirusScannerLambdaPayloadOkType = {
  statusCode: StatusCodes.OK
  body: ParseVirusScannerLambdaPayloadOkBody
}

export type ParseVirusScannerLambdaPayloadErrBody = {
  message: string
}

export type ParseVirusScannerLambdaPayloadErrType = {
  statusCode: number // custom status codes might be sent by the lambda
  body: ParseVirusScannerLambdaPayloadErrBody
}

// Helper function to check if the payload is of the expected structure
export const payloadIsExpectedStructure = (
  parsedPayload: unknown,
): false | ParseVirusScannerLambdaPayloadBeforeBodyIsParsed => {
  return (
    typeof parsedPayload === 'object' &&
    !!parsedPayload &&
    hasProp(parsedPayload, 'statusCode') &&
    typeof parsedPayload.statusCode === 'number' &&
    hasProp(parsedPayload, 'body') &&
    typeof parsedPayload.body === 'string' &&
    (parsedPayload as ParseVirusScannerLambdaPayloadBeforeBodyIsParsed)
  )
}

// Helper function to check if the body is of the expected structure for OK status code
export const bodyIsExpectedOkStructure = (
  parsedBody: unknown,
): false | ParseVirusScannerLambdaPayloadOkBody => {
  return (
    typeof parsedBody === 'object' &&
    !!parsedBody &&
    hasProp(parsedBody, 'cleanFileKey') &&
    typeof parsedBody.cleanFileKey === 'string' &&
    hasProp(parsedBody, 'destinationVersionId') &&
    typeof parsedBody.destinationVersionId === 'string' &&
    (parsedBody as ParseVirusScannerLambdaPayloadOkBody)
  )
}

// Helper function to check if the body is of the expected structure for non-OK status code
export const bodyIsExpectedErrStructure = (
  parsedBody: unknown,
): false | ParseVirusScannerLambdaPayloadErrBody => {
  return (
    typeof parsedBody === 'object' &&
    !!parsedBody &&
    hasProp(parsedBody, 'message') &&
    typeof parsedBody.message === 'string' &&
    (parsedBody as ParseVirusScannerLambdaPayloadErrBody)
  )
}
