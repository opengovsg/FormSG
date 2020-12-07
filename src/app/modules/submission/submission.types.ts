import {
  IAttachmentResponse,
  ICheckboxResponse,
  ISingleAnswerResponse,
  ITableResponse,
} from 'src/types/response'

export type ProcessedResponse = {
  isVisible?: boolean
  isUserVerified?: boolean
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
