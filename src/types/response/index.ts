import {
  CheckboxResponse,
  TableResponse,
  TableRow,
} from '../../../shared/types/response'
import {
  EncryptAttachmentResponse,
  EncryptFormFieldResponse,
  ParsedEmailAttachmentResponse,
  ParsedEmailFormFieldResponse,
} from '../api'

export type IAttachmentResponse =
  | ParsedEmailAttachmentResponse
  | EncryptAttachmentResponse

export type ISingleAnswerResponse =
  | Exclude<
      EncryptFormFieldResponse,
      TableResponse | CheckboxResponse | IAttachmentResponse
    >
  | Exclude<
      ParsedEmailFormFieldResponse,
      TableResponse | CheckboxResponse | IAttachmentResponse
    >

export type ICheckboxResponse = CheckboxResponse
export type ITableResponse = TableResponse
export type ITableRow = TableRow

export type FieldResponse =
  | EncryptFormFieldResponse
  | ParsedEmailFormFieldResponse
