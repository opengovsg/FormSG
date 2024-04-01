import {
  AttachmentFieldResponseV3,
  AttachmentResponse,
  AttachmentResponseV3,
  FieldResponse,
  FieldResponseV3,
  FormFieldDto,
} from '../../../shared/types'

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

/**
 * AttachmentResponses with hydrated content from server
 *
 * Note: JSON.parse(JSON.stringify(fooBuffer)) does not reconstruct the Buffer object
 */
export type HydratedClearAttachmentFieldResponseV3 =
  AttachmentFieldResponseV3 & {
    filename: string
    content: {
      data: string
      type: 'buffer'
    }
  }

export type ParsedClearAttachmentResponseV3 = Omit<
  AttachmentResponseV3,
  'answer'
> & {
  answer: ParsedClearAttachmentFieldResponseV3
}

export type HydratedClearAttachmentResponseV3 = Omit<
  AttachmentResponseV3,
  'answer'
> & {
  answer: HydratedClearAttachmentFieldResponseV3
}

export type ParsedClearFormFieldResponseV3 =
  | Exclude<FieldResponseV3, AttachmentResponseV3>
  | ParsedClearAttachmentResponseV3

export type ParsedClearFormFieldResponsesV3 = Record<
  FormFieldDto['_id'],
  ParsedClearFormFieldResponseV3
>
