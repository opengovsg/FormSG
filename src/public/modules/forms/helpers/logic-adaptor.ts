import { cloneDeep, omit } from 'lodash'

import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
  IClientFieldSchema,
  ILogicClientFieldSchema,
} from '../../../../shared/util/logic'
import {
  BasicField,
  ICheckboxFieldSchema,
  IFieldSchema,
  IFormDocument,
  IPopulatedForm,
  IPreventSubmitLogicSchema,
} from '../../../../types'

interface ICheckboxClientFieldSchema
  extends Omit<IClientFieldSchema, 'fieldValue'> {
  fieldValue: boolean[]
}

const isCheckboxResponse = (
  field: IClientFieldSchema,
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
): ILogicClientFieldSchema => {
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
export const adaptSubmissionForLogicModule = (
  submission: IClientFieldSchema[],
  form: IFormDocument,
): ILogicClientFieldSchema[] => {
  return submission.map((field) => {
    const clonedField = cloneDeep(field)
    if (isCheckboxResponse(clonedField)) {
      return convertClientCheckboxValue(clonedField, form.form_fields)
    } else {
      return clonedField as ILogicClientFieldSchema
    }
  })
}

export const getVisibleFieldIds = (
  submission: IClientFieldSchema[],
  form: IFormDocument,
): FieldIdSet => {
  const transformedSubmission = adaptSubmissionForLogicModule(submission, form)
  return logicGetVisibleFieldIds(transformedSubmission, form)
}

export const getLogicUnitPreventingSubmit = (
  submission: IClientFieldSchema[],
  form: IFormDocument,
  visibleFieldIds?: FieldIdSet,
): IPreventSubmitLogicSchema | undefined => {
  const transformedSubmission = adaptSubmissionForLogicModule(submission, form)
  return logicGetLogicUnitPreventingSubmit(
    transformedSubmission,
    form,
    visibleFieldIds,
  )
}
