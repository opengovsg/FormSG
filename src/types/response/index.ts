import {
  CheckboxResponse,
  EncryptAttachmentResponse,
  EncryptFormFieldResponse,
  TableResponse,
} from '../../../shared/types'
import {
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
