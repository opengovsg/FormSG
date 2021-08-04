import { Merge } from 'type-fest'

import {
  AttachmentResponse,
  FieldResponse,
} from '../../../shared/types/response'
import { EmailModeSubmissionContentDto } from '../../../shared/types/submission'

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
