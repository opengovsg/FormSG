import type { Merge } from 'type-fest'

import {
  AttachmentResponse,
  EmailModeSubmissionContentDto,
  FieldResponse,
} from '../../../shared/types'

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

/**
 * Email submission body after req.body's FormData has passed through the
 * EmailSubmissionMiddleware.receiveEmailSubmission middleware.
 */
export type ParsedEmailModeSubmissionBody = Merge<
  EmailModeSubmissionContentDto,
  { responses: ParsedEmailFormFieldResponse[] }
>
