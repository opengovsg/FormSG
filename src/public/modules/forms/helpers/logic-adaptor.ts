import { cloneDeep, omit } from 'lodash'

import * as Logic from '../../../../shared/util/logic'
import {
  BasicField,
  ICheckboxFieldSchema,
  IFieldSchema,
  IFormDocument,
  IPopulatedForm,
  IPreventSubmitLogicSchema,
} from '../../../../types'

export {
  getApplicableIfStates,
  getApplicableIfFields,
} from '../../../../shared/util/logic'

interface ICheckboxClientFieldSchema
  extends Omit<Logic.IClientFieldSchema, 'fieldValue'> {
  fieldValue: boolean[]
}

const isCheckboxResponse = (
  field: Logic.IClientFieldSchema,
): field is ICheckboxClientFieldSchema => {
  return field.fieldType === BasicField.Checkbox
}

const isCheckboxField = (
  field: IFieldSchema | undefined,
): field is ICheckboxFieldSchema => {
  return field?.fieldType === BasicField.Checkbox
}

const convertClientCheckboxValue = (
  field: ICheckboxClientFieldSchema,
  formFields: IPopulatedForm['form_fields'],
): Logic.ILogicClientFieldSchema => {
  const completeField = formFields.find(
    (formField) => String(formField._id) === field._id,
  )
  if (!isCheckboxField(completeField)) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error(`${completeField} is not a Checkbox field`)
  }

  const others = field.fieldValue[completeField.fieldOptions.length]
  const options = completeField.fieldOptions.filter(
    (_, i) => field.fieldValue[i],
  )

  return {
    ...omit(field, ['fieldValue']),
    fieldValue: { options, others },
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
  submission: Logic.IClientFieldSchema[],
  form: IFormDocument,
): Logic.ILogicClientFieldSchema[] => {
  return submission.map((field) => {
    const clonedField = cloneDeep(field)
    if (isCheckboxResponse(clonedField)) {
      return convertClientCheckboxValue(clonedField, form.form_fields)
    } else {
      return clonedField as Logic.ILogicClientFieldSchema
    }
  })
}

export const getVisibleFieldIds = (
  submission: Logic.IClientFieldSchema[],
  form: IFormDocument,
): Logic.FieldIdSet => {
  const transformedSubmission = adaptSubmissionForLogicModule(submission, form)
  return Logic.getVisibleFieldIds(transformedSubmission, form)
}

export const getLogicUnitPreventingSubmit = (
  submission: Logic.IClientFieldSchema[],
  form: IFormDocument,
  visibleFieldIds?: Logic.FieldIdSet,
): IPreventSubmitLogicSchema | undefined => {
  const transformedSubmission = adaptSubmissionForLogicModule(submission, form)
  return Logic.getLogicUnitPreventingSubmit(
    transformedSubmission,
    form,
    visibleFieldIds,
  )
}
