import { AttachmentResponse, FieldResponse } from '../../../shared/types'

/**
 * AttachmentResponses with additional server injected metadata on email forms.
 */
export type ParsedEmailAttachmentResponse = AttachmentResponse & {
  filename: string
  content: Buffer
}

export type ParsedEmailFormFieldResponse =
  | Exclude<FieldResponse, AttachmentResponse>
  | ParsedEmailAttachmentResponse
