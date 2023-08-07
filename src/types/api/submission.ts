import { AttachmentResponse, FieldResponse } from '../../../shared/types'

/**
 * AttachmentResponses with additional server injected metadata on email forms.
 */
export type ParsedClearAttachmentResponse = AttachmentResponse & {
  filename: string
  content: Buffer
}

export type ParsedClearFormFieldResponse =
  | Exclude<FieldResponse, AttachmentResponse>
  | ParsedClearAttachmentResponse
