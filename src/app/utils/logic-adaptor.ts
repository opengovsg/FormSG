import { cloneDeep, omit } from 'lodash'
import { err, ok, Result } from 'neverthrow'

import * as Logic from '../../shared/util/logic'
import {
  BasicField,
  FieldResponse,
  ICheckboxFieldSchema,
  ICheckboxResponse,
  IFieldSchema,
  IFormDocument,
  IPopulatedForm,
  IPreventSubmitLogicSchema,
} from '../../types'
import { ResponseFieldMismatchError } from '../modules/submission/submission.errors'

export { FieldIdSet, getApplicableIfStates } from '../../shared/util/logic'

const isCheckboxField = (
  field: IFieldSchema | undefined,
): field is ICheckboxFieldSchema => {
  return field?.fieldType === BasicField.Checkbox
}

const isCheckboxFieldResponse = (
  field: FieldResponse,
): field is ICheckboxResponse => {
  return field.fieldType === BasicField.Checkbox
}

const convertServerCheckboxValue = (
  field: ICheckboxResponse,
  formFields: IPopulatedForm['form_fields'],
): Logic.LogicFieldResponse => {
  const completeField = formFields.find(
    (formField) => String(formField._id) === String(field._id),
  )
  if (!isCheckboxField(completeField)) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error(`${completeField} is not a Checkbox Field`)
  }

  const withOthersPrefix = field.answerArray.filter((value) =>
    value.startsWith('Others: '),
  )
  // In-built others option is selected if at least one of them is not
  // a user-defined option i.e. is one of the field options
  const inBuiltOthers = withOthersPrefix.find(
    (value) => !completeField.fieldOptions.includes(value),
  )

  let others = false
  if (inBuiltOthers) {
    field.answerArray.splice(field.answerArray.indexOf(inBuiltOthers), 1)
    others = true
  }

  return {
    ...omit(field, ['answerArray']),
    answerArray: { options: field.answerArray, others },
  }
}

// exported for testing
/**
 * Converts each response in submission to suitable shape for logic module
 * @param submission
 * @param form
 * @throws Error when response and field do not match
 * @returns Transformed submission
 */
export const adaptSubmissionForLogicModule = (
  submission: FieldResponse[],
  form: IFormDocument,
): Logic.LogicFieldResponse[] => {
  return submission.map((field) => {
    const clonedField = cloneDeep(field)
    if (isCheckboxFieldResponse(clonedField)) {
      return convertServerCheckboxValue(clonedField, form.form_fields)
    } else {
      return clonedField as Logic.LogicFieldResponse
    }
  })
}

export const getVisibleFieldIds = (
  submission: FieldResponse[],
  form: IFormDocument,
): Result<Logic.FieldIdSet, ResponseFieldMismatchError> => {
  const transformedSubmission = Result.fromThrowable(
    adaptSubmissionForLogicModule,
    (e: unknown) =>
      new ResponseFieldMismatchError(
        e,
        'Something went wrong when processing submission for logic',
      ),
  )(submission, form)

  if (transformedSubmission.isErr()) {
    return err(transformedSubmission.error)
  }
  return ok(Logic.getVisibleFieldIds(transformedSubmission.value, form))
}

export const getLogicUnitPreventingSubmit = (
  submission: FieldResponse[],
  form: IFormDocument,
  visibleFieldIds?: Logic.FieldIdSet,
): Result<
  IPreventSubmitLogicSchema | undefined,
  ResponseFieldMismatchError
> => {
  const transformedSubmission = Result.fromThrowable(
    adaptSubmissionForLogicModule,
    (e: unknown) =>
      new ResponseFieldMismatchError(
        e,
        'Something went wrong when processing submission for logic',
      ),
  )(submission, form)

  if (transformedSubmission.isErr()) {
    return err(transformedSubmission.error)
  }
  return ok(
    Logic.getLogicUnitPreventingSubmit(
      transformedSubmission.value,
      form,
      visibleFieldIds,
    ),
  )
}
