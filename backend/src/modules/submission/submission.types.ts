import {
  IAttachmentResponse,
  ICheckboxResponse,
  ISingleAnswerResponse,
  ITableResponse,
} from '@root/types/response'

import { BasicField } from '@root/types/field'

export type ProcessedResponse = {
  question: string
  isVisible?: boolean
  isUserVerified?: boolean
}

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
