import type {
  AttachmentAnswerV4,
  FieldResponseV4,
  FormFieldV4,
} from '@opengovsg/formsg-sdk'
import {
  AttachmentFieldResponseV3,
  AttachmentResponse,
  AttachmentResponseV3,
  BasicField,
  FieldResponse,
  FieldResponseV3,
  FormFieldDto,
} from 'formsg-shared/types'

/**
 * AttachmentResponses with additional server injected metadata on email and storage v2+ forms.
 */
export type ParsedClearAttachmentResponse = AttachmentResponse & {
  filename: string
  content: Buffer
}

export type ParsedClearFormFieldResponse =
  | Exclude<FieldResponse, AttachmentResponse>
  | ParsedClearAttachmentResponse

/**
 * AttachmentResponses with additional server injected metadata on email and storage v2+ forms.
 */
export type ParsedClearAttachmentFieldResponseV3 = AttachmentFieldResponseV3 & {
  filename: string
  content: Buffer
}

export type ParsedClearAttachmentResponseV3 = Omit<
  AttachmentResponseV3,
  'answer'
> & {
  answer: ParsedClearAttachmentFieldResponseV3
}

export type ParsedClearFormFieldResponseV3 =
  | Exclude<FieldResponseV3, AttachmentResponseV3>
  | ParsedClearAttachmentResponseV3

export type ParsedClearFormFieldResponsesV3 = Record<
  FormFieldDto['_id'],
  ParsedClearFormFieldResponseV3
>

type AttachmentResponseV4 = Extract<
  FormFieldV4,
  { fieldType: BasicField.Attachment }
>

/** V4 attachment answer enriched with receiver-injected binary fields. */
export type ParsedClearAttachmentAnswerV4 = AttachmentAnswerV4 & {
  filename: string
  content: Buffer
}

export type ParsedClearAttachmentFieldResponseV4 = Omit<
  AttachmentResponseV4,
  'answer'
> & {
  answer: ParsedClearAttachmentAnswerV4
}

export type ParsedClearFormFieldResponseV4 =
  | Exclude<FieldResponseV4, AttachmentResponseV4>
  | ParsedClearAttachmentFieldResponseV4

export type ParsedClearFormFieldResponsesV4 = Record<
  string,
  ParsedClearFormFieldResponseV4
>
