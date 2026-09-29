import { MAX_SUBMISSION_METADATA_PAGE_SIZE } from 'formsg-shared/types'

import { TABLE_DECRYPTION_LIMIT } from '../../../constants'

/**
 * The table asks for page 1 at TABLE_DECRYPTION_LIMIT, sorted newest first, so
 * a form past the limit is only ever loaded, filtered and sorted over its most
 * recent responses. The server refuses a larger page than this.
 */
export const TABLE_RESPONSE_LIMIT = Math.min(
  TABLE_DECRYPTION_LIMIT,
  MAX_SUBMISSION_METADATA_PAGE_SIZE,
)

export const exceedsTableLimit = (totalCount?: number): boolean =>
  (totalCount ?? 0) > TABLE_RESPONSE_LIMIT
