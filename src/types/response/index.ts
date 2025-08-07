import {
  AddressResponse,
  CheckboxResponse,
  ChildBirthRecordsResponse,
  SignatureResponse,
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
      | SignatureResponse
    >
  | Exclude<
      ParsedClearFormFieldResponse,
      | TableResponse
      | CheckboxResponse
      | IAttachmentResponse
      | ChildBirthRecordsResponse
      | AddressResponse
      | SignatureResponse
    >

export type FieldResponse =
  | EncryptFormFieldResponse
  | ParsedClearFormFieldResponse
