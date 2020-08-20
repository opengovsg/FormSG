import _ from 'lodash'

import {
  getLogicUnitPreventingSubmit,
  getVisibleFieldIds,
} from '../../shared/util/logic'
import {
  BasicField,
  IFieldSchema,
  IFormSchema,
  IMyInfo,
  ResponseMode,
} from '../../types'

import { FIELDS_TO_REJECT } from './field-validation/config'
import { ConflictError } from './custom-errors'
import validateField from './field-validation'

// TODO(#42): Move this typing to a more appropriate place, either routes or
// controller types when they have been migrated to Typescript.
export type FormResponse = {
  _id: string
  question: string
  fieldType: BasicField
  isHeader?: boolean
  myInfo?: IMyInfo
  signature?: string
} & (
  | { answer: string; answerArray?: never }
  | { answer?: never; answerArray: string[] }
)

type ParsedFormResponse = FormResponse & {
  isVisible?: boolean
  isUserVerified?: boolean
}

type ModeFilterParam = {
  fieldType: BasicField
}

/**
 * Construct parsed responses by checking visibility and injecting questions.
 *
 * @param form The form document
 * @param bodyResponses the responses that corresponds to the given form
 * @param responseMode the form mode to filter by
 * @throws error if form submission should be prevented by logic
 * @returns the list of parsed responses from the initial responses
 */
export const getParsedResponses = (
  form: IFormSchema,
  bodyResponses: FormResponse[],
  responseMode: ResponseMode,
) => {
  const responses = getResponsesForEachField(form, bodyResponses, responseMode)

  // Set of all visible fields
  const visibleFieldIds = getVisibleFieldIds(responses, form)

  // Guard against invalid form submissions that should have been prevented by
  // logic.
  if (getLogicUnitPreventingSubmit(responses, form, visibleFieldIds)) {
    throw new Error('Submission prevented by form logic')
  }

  // Create a map keyed by field._id for easier access
  const fieldMap = form.form_fields.reduce<{
    [fieldId: string]: IFieldSchema
  }>((acc, field) => {
    acc[field._id] = field
    return acc
  }, {})

  // Validate each field in the form and construct parsed responses for
  // downstream processing.
  const parsedResponses = responses.map((response) => {
    const responseId = response._id
    const parsedResponse: ParsedFormResponse = { ...response }
    // In FormValidator, we have checked that all the form field ids exist, so
    // this wont be null.
    const formField = fieldMap[responseId]
    parsedResponse.isVisible = visibleFieldIds.has(responseId)

    // Instance method of base field schema.
    parsedResponse.question = formField.getQuestion()
    if (formField.isVerifiable) {
      // This is only correct because validateField should have thrown an error
      // if the signature was wrong.
      parsedResponse.isUserVerified = true
    }

    // Error will be thrown if field is not valid.
    // Must be after parsedResponse has been fully built, or it will not
    // validate correctly.
    validateField(form._id, formField, parsedResponse)
    return parsedResponse
  })

  return parsedResponses
}

/**
 * For each form field, select the first response that is available for that
 * field. Returns the array of such responses.
 *
 * @param form The form document
 * @param responses the responses that corresponds to the given form
 * @param responseMode the form mode to filter by
 * @returns array of responses (the first one) for each field in the form.
 */
const getResponsesForEachField = (
  form: IFormSchema,
  responses: FormResponse[],
  responseMode: ResponseMode,
) => {
  const modeFilter = getModeFilter(responseMode)

  // _id must be transformed to string as form response is jsonified.
  const fieldIds = modeFilter(form.form_fields).map((field) => ({
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

const getModeFilter = (responseMode: ResponseMode) => {
  switch (responseMode) {
    case ResponseMode.Email:
      return emailModeFilter
    case ResponseMode.Encrypt:
      return encryptModeFilter
    default:
      throw Error('getResponsesForEachField: Invalid response mode parameter')
  }
}

const emailModeFilter = <T extends ModeFilterParam>(responses: T[]) => {
  return responses.filter(
    ({ fieldType }) => !FIELDS_TO_REJECT.includes(fieldType),
  )
}

const encryptModeFilter = <T extends ModeFilterParam>(responses: T[] = []) => {
  // To filter for autoreply-able fields.
  return responses.filter(({ fieldType }) =>
    [BasicField.Mobile, BasicField.Email].includes(fieldType),
  )
}
