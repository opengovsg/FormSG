import type { Merge } from 'type-fest'

import {
  EmailModeSubmissionContentDto,
  ResponseMetadata,
} from '../../../shared/types'

import { ParsedEmailFormFieldResponse } from './submission'

/**
 * Email submission body after req.body's FormData has passed through the
 * EmailSubmissionMiddleware.receiveEmailSubmission middleware.
 */
export type ParsedEmailModeSubmissionBody = Merge<
  EmailModeSubmissionContentDto,
  {
    responses: ParsedEmailFormFieldResponse[]
    responseMetadata?: ResponseMetadata
  }
>
