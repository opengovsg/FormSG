import type { Merge } from 'type-fest'

import {
  EmailModeSubmissionContentDto,
  ResponseMetadata,
} from '../../../shared/types'

import { ParsedClearFormFieldResponse } from './submission'

/**
 * Email submission body after req.body's FormData has passed through the
 * EmailSubmissionMiddleware.receiveEmailSubmission middleware.
 */
export type ParsedEmailModeSubmissionBody = Merge<
  EmailModeSubmissionContentDto,
  {
    responses: ParsedClearFormFieldResponse[]
    responseMetadata?: ResponseMetadata
  }
>
