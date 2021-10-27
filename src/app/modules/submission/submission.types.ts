import { Opaque } from 'type-fest'

import {
  BasicField,
  CheckboxResponse,
  EncryptAttachmentResponse,
  TableResponse,
} from '../../../../shared/types'
import { ParsedEmailAttachmentResponse } from '../../../types/api'
import { FormFieldSchema } from '../../../types/field'
import { SingleAnswerFieldResponse } from '../../../types/response'

import { FormFieldResponse } from './../../../../shared/types/response'

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
export type FilteredResponse = Opaque<FormFieldResponse, 'FilteredResponse'>

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
/**
 * Can be either email or storage mode attachment response.
 * Email mode attachment response in the server will have extra metadata injected
 * by a middleware.
 * Storage mode attachment response is the default response.
 */
export type ProcessedAttachmentResponse = (
  | ParsedEmailAttachmentResponse
  | EncryptAttachmentResponse
) &
  ProcessedResponse

export type ProcessedFieldResponse =
  | ProcessedSingleAnswerResponse
  | ProcessedCheckboxResponse
  | ProcessedTableResponse
  | ProcessedAttachmentResponse
