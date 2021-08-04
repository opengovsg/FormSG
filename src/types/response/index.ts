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

export type SingleAnswerFieldResponse =
  | Exclude<
      EncryptFormFieldResponse,
      TableResponse | CheckboxResponse | IAttachmentResponse
    >
  | Exclude<
      ParsedEmailFormFieldResponse,
      TableResponse | CheckboxResponse | IAttachmentResponse
    >

export { CheckboxResponse, TableResponse, TableRow }

export type FieldResponse =
  | EncryptFormFieldResponse
  | ParsedEmailFormFieldResponse
