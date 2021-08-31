import { CheckboxResponse, TableResponse } from '../../../shared/types'
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

export type FieldResponse =
  | EncryptFormFieldResponse
  | ParsedEmailFormFieldResponse
