import {
  CheckboxResponse,
  ChildBirthRecordsResponse,
  TableResponse,
} from '../../../shared/types'
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
      | TableResponse
      | CheckboxResponse
      | IAttachmentResponse
      | ChildBirthRecordsResponse
    >
  | Exclude<
      ParsedEmailFormFieldResponse,
      | TableResponse
      | CheckboxResponse
      | IAttachmentResponse
      | ChildBirthRecordsResponse
    >

export type FieldResponse =
  | EncryptFormFieldResponse
  | ParsedEmailFormFieldResponse
