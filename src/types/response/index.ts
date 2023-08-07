import {
  CheckboxResponse,
  ChildBirthRecordsResponse,
  TableResponse,
} from '../../../shared/types'
import {
  EncryptAttachmentResponse,
  EncryptFormFieldResponse,
  ParsedClearAttachmentResponse,
  ParsedClearFormFieldResponse,
} from '../api'

export type IAttachmentResponse =
  | ParsedClearAttachmentResponse
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
      ParsedClearFormFieldResponse,
      | TableResponse
      | CheckboxResponse
      | IAttachmentResponse
      | ChildBirthRecordsResponse
    >

export type FieldResponse =
  | EncryptFormFieldResponse
  | ParsedClearFormFieldResponse
