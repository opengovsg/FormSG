import { Merge } from 'type-fest'

import {
  AttachmentResponse,
  FieldResponse,
} from '../../../shared/types/response'
import { EmailModeSubmissionContentDto } from '../../../shared/types/submission'

/**
 * AttachmentResponses with additional metadata.
 */
type ParsedAttachmentResponse = AttachmentResponse & {
  filename: string
  content: Buffer
}

type ParsedFieldResponse =
  | Exclude<FieldResponse, AttachmentResponse>
  | ParsedAttachmentResponse

/**
 * Email submission body after req.body's FormData has passed through the
 * EmailSubmissionMiddleware.receiveEmailSubmission middleware.
 */
export type ParsedEmailModeSubmissionBody = Merge<
  EmailModeSubmissionContentDto,
  { responses: ParsedFieldResponse[] }
>
