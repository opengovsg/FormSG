import mongoose from 'mongoose'
import { err, ok, Result } from 'neverthrow'

import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { isMalformedDate } from '../../../utils/date'
import { MalformedParametersError } from '../../core/core.errors'

const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

/**
 * Returns a cursor to the stream of the submissions of the given form id.
 *
 * @param formId the id of the form to stream responses for
 * @param dateRange optional. The date range to limit responses to
 *
 * @returns ok(stream cursor) if created successfully
 * @returns err(MalformedParametersError) if given dates are invalid dates
 */
export const getSubmissionCursor = (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): Result<
  ReturnType<typeof EncryptSubmissionModel.getSubmissionCursorByFormId>,
  MalformedParametersError
> => {
  if (
    isMalformedDate(dateRange.startDate) ||
    isMalformedDate(dateRange.endDate)
  ) {
    return err(new MalformedParametersError('Malformed date parameter'))
  }

  return ok(
    EncryptSubmissionModel.getSubmissionCursorByFormId(formId, dateRange),
  )
}
