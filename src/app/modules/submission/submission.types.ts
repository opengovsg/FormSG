import { Opaque } from 'type-fest'

import {
  IAttachmentResponse,
  ICheckboxResponse,
  ISingleAnswerResponse,
  ITableResponse,
} from 'src/types/response'

import { FieldIdSet } from '../../../shared/util/logic'
import { BasicField, IFieldSchema } from '../../../types/field'

export type ProcessedResponse = {
  question: string
  isVisible?: boolean
  isUserVerified?: boolean
}

/**
 * Represents a field map that is guaranteed to contain the id of
 * ALL responses in an incoming response.
 */
export type ValidatedFieldMap = Opaque<
  { [p: string]: IFieldSchema },
  'ValidatedFieldMap'
>

export type VisibleResponseIdSet = Opaque<FieldIdSet, 'VisibleResponseIdSet'>

export type VerifiableResponseIdSet = Opaque<
  FieldIdSet,
  'VerifiableResponseIdSet'
>

export type ColumnResponse = {
  fieldType: BasicField
  answer: string
  isVisible?: boolean
}

export type ProcessedSingleAnswerResponse = ISingleAnswerResponse &
  ProcessedResponse

export type ProcessedCheckboxResponse = ICheckboxResponse & ProcessedResponse
export type ProcessedTableResponse = ITableResponse & ProcessedResponse
export type ProcessedAttachmentResponse = IAttachmentResponse &
  ProcessedResponse

export type ProcessedFieldResponse =
  | ProcessedSingleAnswerResponse
  | ProcessedCheckboxResponse
  | ProcessedTableResponse
  | ProcessedAttachmentResponse
