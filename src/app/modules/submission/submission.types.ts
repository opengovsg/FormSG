import { StatusCodes } from 'http-status-codes'
import type { Opaque } from 'type-fest'

import {
  BasicField,
  CheckboxResponse,
  ChildBirthRecordsResponse,
  MyInfoChildAttributes,
  TableResponse,
} from '../../../../shared/types'
import { hasProp } from '../../../../shared/utils/has-prop'
import {
  EncryptAttachmentResponse,
  ParsedClearAttachmentResponse,
} from '../../../types/api'
import { FormFieldSchema } from '../../../types/field'
import {
  FieldResponse,
  SingleAnswerFieldResponse,
} from '../../../types/response'

import { ParseVirusScannerLambdaPayloadError } from './submission.errors'

export type AttachmentMetadata = Map<string, string>

export type ProcessedResponse = {
  question: string
  isVisible?: boolean
  isUserVerified?: boolean
}

/**
 * Represents a field map that is guaranteed to contain the id of
 * ALL field responses in an incoming submission.
 */
export type ValidatedFieldMap = Opaque<
  { [p: string]: FormFieldSchema },
  'ValidatedFieldMap'
>

export type VisibleResponseIdSet = Opaque<Set<string>, 'VisibleResponseIdSet'>

export type VerifiableResponseIdSet = Opaque<
  Set<string>,
  'VerifiableResponseIdSet'
>

/**
 * Represents a response allowed by `getModeFilter`. When presented as a
 * list, additionally guarantees that duplicates (if any) are removed.
 * Instantiated ONLY via `getFilteredResponses`.
 */
export type FilteredResponse = Opaque<FieldResponse, 'FilteredResponse'>

export type ColumnResponse = {
  fieldType: BasicField
  answer: string
  isVisible?: boolean
}

export type ProcessedSingleAnswerResponse<
  T extends SingleAnswerFieldResponse = SingleAnswerFieldResponse,
> = T & ProcessedResponse

export type ProcessedCheckboxResponse = CheckboxResponse & ProcessedResponse
export type ProcessedTableResponse = TableResponse & ProcessedResponse
export type ProcessedChildrenResponse = ChildBirthRecordsResponse &
  ProcessedResponse & {
    childSubFieldsArray?: MyInfoChildAttributes[]
    childIdx?: number
  }
/**
 * Can be either email or storage mode attachment response.
 * Email mode attachment response in the server will have extra metadata injected
 * by a middleware.
 * Storage mode attachment response is the default response.
 */
export type ProcessedAttachmentResponse = (
  | ParsedClearAttachmentResponse
  | EncryptAttachmentResponse
) &
  ProcessedResponse

export type ProcessedFieldResponse =
  | ProcessedSingleAnswerResponse
  | ProcessedCheckboxResponse
  | ProcessedTableResponse
  | ProcessedAttachmentResponse
  | ProcessedChildrenResponse

/**
 * Virus scanner types
 */
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

export type ParseVirusScannerLambdaPayloadErrType =
  | {
      statusCode: number // custom status codes might be sent by the lambda
      body: ParseVirusScannerLambdaPayloadErrBody
    }
  | ParseVirusScannerLambdaPayloadError

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
