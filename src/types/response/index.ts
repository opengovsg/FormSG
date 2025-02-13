import {
  AddressResponse,
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
      | AddressResponse
    >
  | Exclude<
      ParsedClearFormFieldResponse,
      | TableResponse
      | CheckboxResponse
      | IAttachmentResponse
      | ChildBirthRecordsResponse
      | AddressResponse
    >

export type FieldResponse =
  | EncryptFormFieldResponse
  | ParsedClearFormFieldResponse
