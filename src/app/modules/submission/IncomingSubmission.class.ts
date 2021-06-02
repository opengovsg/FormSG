import { combine, err, ok, Result } from 'neverthrow'

import {
  FieldIdSet,
  getLogicUnitPreventingSubmit,
} from '../../../shared/util/logic'
import {
  FieldResponse,
  IFieldSchema,
  IFormDocument,
  IPopulatedForm,
} from '../../../types'
import { validateField } from '../../utils/field-validation'

import { ProcessingError, ValidateFieldError } from './submission.errors'
import {
  ProcessedFieldResponse,
  ValidatedFieldMap,
  VerifiableResponseIdSet,
  VisibleResponseIdSet,
} from './submission.types'

export class IncomingSubmission {
  protected constructor(
    public readonly responses: FieldResponse[],
    public readonly form: IPopulatedForm,
  ) {}

  /**
   * Generate a look-up table that maps an object ID to form field.
   * Additionally, guarantees that every response's ID can be found.
   * @param form - The form to generate the lookup table for.
   * @param responses - List of responses. Used for validation to achieve
   * said guarantee.
   * @returns neverthrow ok() with look-up table.
   * @returns neverthrow err() if form object does not have `form_fields`,
   * or if there exists a response whose ID is not a key in the lookup
   * table.
   * @protected
   */
  protected static getFieldMap(
    form: IFormDocument,
    responses: FieldResponse[],
  ): Result<ValidatedFieldMap, ProcessingError> {
    if (!form.form_fields) {
      return err(new ProcessingError('Form fields are undefined'))
    }

    const fieldMap = form.form_fields.reduce<{
      [fieldId: string]: IFieldSchema
    }>((acc, field) => {
      acc[field._id] = field
      return acc
    }, {})

    const validationResultList = responses.map((r) => {
      const responseId = r._id
      const formField = fieldMap[responseId]
      if (!formField) {
        return err(
          new ProcessingError('Response ID does not match form field IDs'),
        )
      }
      return ok(r)
    })

    const validationResultCombined = combine(validationResultList)
    if (validationResultCombined.isErr()) {
      return err(
        new ProcessingError('Response ID does not match form field IDs'),
      )
    }

    return ok(fieldMap as ValidatedFieldMap)
  }

  /**
   * Generates a set of response IDs that are visible.
   * @param responses
   * @param visibilityPredicate - Predicate that determines if a response
   * is visible.
   * @returns visibleResponseIds - Generated set of response IDs.
   * @protected
   */
  protected static getVisibleResponseIds({
    responses,
    visibilityPredicate,
  }: {
    responses: FieldResponse[]
    visibilityPredicate: (r: FieldResponse) => boolean
  }): VisibleResponseIdSet {
    return responses.reduce<FieldIdSet>((acc, response) => {
      const responseId = response._id
      if (visibilityPredicate(response)) {
        acc.add(responseId)
      }
      return acc
    }, new Set()) as VisibleResponseIdSet
  }

  /**
   * Generates a set of response IDs that are verifiable. A response is
   * said to be verifiable if its corresponding form field has the
   * isVerifiable property set to `true`.
   * @param responses
   * @param fieldMap
   * @returns verifiableResponseIds - Generated set of response IDs.
   * @protected
   */
  protected static getVerifiableResponseIds({
    responses,
    fieldMap,
  }: {
    responses: FieldResponse[]
    fieldMap: ValidatedFieldMap
  }): VerifiableResponseIdSet {
    return responses.reduce<FieldIdSet>((acc, response) => {
      const responseId = response._id
      const formField = fieldMap[responseId]
      if (formField.isVerifiable) {
        acc.add(responseId)
      }
      return acc
    }, new Set()) as VerifiableResponseIdSet
  }

  /**
   * Prior to the introduction of IncomingResponse, responses were
   * stored in a ProcessedFieldResponse[]. This method helps to
   * create a ProcessedFieldResponse object that can be used in
   * functions that have not been refactored to take in the new
   * IncomingResponse object.
   *
   * A ProcessedResponse is just a regular FieldResponse with some
   * metadata inserted into them. This function takes in several
   * data sets that help determine what each metadata field should
   * contain.
   * @param response
   * @param fieldMap
   * @param visibleResponseIds
   * @param verifiableResponseIds
   * @returns processedFieldResponse - The ProcessedFieldResponse
   * @protected
   */
  protected static getLegacyProcessedFieldResponse({
    response,
    fieldMap,
    visibleResponseIds,
    verifiableResponseIds,
  }: {
    response: FieldResponse
    fieldMap: ValidatedFieldMap
    visibleResponseIds: VisibleResponseIdSet
    verifiableResponseIds: VerifiableResponseIdSet
  }): ProcessedFieldResponse {
    const responseId = response._id
    const formField = fieldMap[responseId]
    const processedResponse: ProcessedFieldResponse = {
      ...response,
      isVisible: visibleResponseIds.has(responseId),
      question: formField.getQuestion(),
    }

    /**
     * This pattern of mutating processedResponse is copied from the original
     * getProcessedResponse function. TODO: Check if can just move this into
     * the object instantiation stage, preserving the possible undefined value.
     */
    if (verifiableResponseIds.has(responseId)) {
      processedResponse.isUserVerified = true
    }

    return processedResponse
  }

  protected static validateResponses({
    responses,
    form,
    fieldMap,
    visibleFieldIds,
    visibleResponseIds,
    verifiableResponseIds,
  }: {
    responses: FieldResponse[]
    form: IFormDocument
    fieldMap: ValidatedFieldMap
    visibleFieldIds: FieldIdSet
    visibleResponseIds: VisibleResponseIdSet
    verifiableResponseIds: VerifiableResponseIdSet
  }): Result<true, ProcessingError | ValidateFieldError> {
    // Guard against invalid form submissions that should have been prevented by
    // logic.
    if (getLogicUnitPreventingSubmit(responses, form, visibleFieldIds)) {
      return err(new ProcessingError('Submission prevented by form logic'))
    }

    const validationResultList = responses.map((response) => {
      const responseId = response._id
      const formField = fieldMap[responseId]
      return validateField(
        form._id,
        formField,
        this.getLegacyProcessedFieldResponse({
          response,
          fieldMap,
          visibleResponseIds,
          verifiableResponseIds,
        }),
      )
    })

    const validationResultCombined = combine(validationResultList)
    if (validationResultCombined.isErr()) {
      return err(validationResultCombined.error)
    }

    return ok(true)
  }
}
