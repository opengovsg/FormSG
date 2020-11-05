import _ from 'lodash'
import mongoose from 'mongoose'
import { errAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  getLogicUnitPreventingSubmit,
  getVisibleFieldIds,
} from '../../../shared/util/logic'
import { FieldResponse, IFieldSchema, IFormSchema } from '../../../types'
import getSubmissionModel from '../../models/submission.server.model'
import { createQueryWithDateParam, isMalformedDate } from '../../utils/date'
import { validateField } from '../../utils/field-validation'
import { DatabaseError, MalformedParametersError } from '../core/core.errors'

import { ConflictError } from './submission.errors'
import { ProcessedFieldResponse } from './submission.types'
import { getModeFilter } from './submission.utils'

const logger = createLoggerWithLabel(module)
const SubmissionModel = getSubmissionModel(mongoose)

/**
 * Filter allowed form field responses from given responses and return the
 * array of responses with duplicates removed.
 *
 * @param form The form document
 * @param responses the responses that corresponds to the given form
 * @returns filtered list of allowed responses with duplicates (if any) removed
 * @throws ConflictError if the given form's form field ids count do not match given responses'
 */
const getFilteredResponses = (
  form: IFormSchema,
  responses: FieldResponse[],
) => {
  const modeFilter = getModeFilter(form.responseMode)

  // _id must be transformed to string as form response is jsonified.
  // TODO (#317): remove usage of non-null assertion
  const fieldIds = modeFilter(form.form_fields!).map((field) => ({
    _id: String(field._id),
  }))
  const uniqueResponses = _.uniqBy(modeFilter(responses), '_id')
  const results = _.intersectionBy(uniqueResponses, fieldIds, '_id')

  if (results.length < fieldIds.length) {
    const onlyInForm = _.differenceBy(fieldIds, results, '_id').map(
      ({ _id }) => _id,
    )
    throw new ConflictError(
      `formId="${form._id}" message="Some form fields are missing" onlyInForm="${onlyInForm}"`,
    )
  }
  return results
}

/**
 * Injects response metadata such as the question, visibility state. In
 * addition, validation such as input validation or signature validation on
 * verified fields are also performed on the response.
 * @param form The form document corresponding to the responses
 * @param responses The responses to process and validate
 * @returns field responses with additional metadata injected.
 * @throws Error if response validation fails
 */
export const getProcessedResponses = (
  form: IFormSchema,
  originalResponses: FieldResponse[],
): ProcessedFieldResponse[] => {
  const filteredResponses = getFilteredResponses(form, originalResponses)

  // Set of all visible fields
  const visibleFieldIds = getVisibleFieldIds(filteredResponses, form)

  // Guard against invalid form submissions that should have been prevented by
  // logic.
  if (getLogicUnitPreventingSubmit(filteredResponses, form, visibleFieldIds)) {
    throw new Error('Submission prevented by form logic')
  }

  // Create a map keyed by field._id for easier access
  // TODO (#317): remove usage of non-null assertion
  const fieldMap = form.form_fields!.reduce<{
    [fieldId: string]: IFieldSchema
  }>((acc, field) => {
    acc[field._id] = field
    return acc
  }, {})

  // Validate each field in the form and inject metadata into the responses.
  const processedResponses = filteredResponses.map((response) => {
    const responseId = response._id
    const formField = fieldMap[responseId]
    if (!formField) {
      throw new Error('Response ID does not match form field IDs')
    }

    const processingResponse: ProcessedFieldResponse = {
      ...response,
      isVisible: visibleFieldIds.has(responseId),
      question: formField.getQuestion(),
    }

    if (formField.isVerifiable) {
      processingResponse.isUserVerified = formField.isVerifiable
    }

    // Error will be thrown if the processed response is not valid.
    validateField(form._id, formField, processingResponse)
    return processingResponse
  })

  return processedResponses
}

/**
 * Returns number of form submissions of given form id in the given date range.
 *
 * @param formId the form id to retrieve submission counts for
 * @param dateRange optional date range to narrow down submission count
 * @param dateRange.startDate the start date of the date range
 * @param dateRange.endDate the end date of the date range
 *
 * @returns ok(form submission count)
 * @returns err(MalformedParametersError) if date range provided is malformed
 * @returns err(DatabaseError) if database query errors
 * @
 */
export const getFormSubmissionsCount = (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): ResultAsync<number, MalformedParametersError | DatabaseError> => {
  if (
    isMalformedDate(dateRange.startDate) ||
    isMalformedDate(dateRange.endDate)
  ) {
    return errAsync(new MalformedParametersError('Malformed date parameter'))
  }

  const countQuery = {
    form: formId,
    ...createQueryWithDateParam(dateRange?.startDate, dateRange?.endDate),
  }

  return ResultAsync.fromPromise(
    SubmissionModel.countDocuments(countQuery).exec(),
    (error) => {
      logger.error({
        message: 'Error counting submission documents from database',
        meta: {
          action: 'getFormSubmissionsCount',
          formId,
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
