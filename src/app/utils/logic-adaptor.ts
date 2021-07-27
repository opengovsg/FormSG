import { cloneDeep, omit } from 'lodash'
import { err, fromThrowable, ok, Result } from 'neverthrow'

import { hasProp } from '../../shared/util/has-prop'
import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
  LogicFieldResponse,
} from '../../shared/util/logic'
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
import { ProcessingError } from '../modules/submission/submission.errors'

export { FieldIdSet } from '../../shared/util/logic'

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
): LogicFieldResponse => {
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

const adaptSubmissionForLogicModule = (
  submission: FieldResponse[],
  form: IFormDocument,
): LogicFieldResponse[] => {
  return submission.map((field) => {
    const clonedField = cloneDeep(field)
    if (isCheckboxFieldResponse(clonedField)) {
      return convertServerCheckboxValue(clonedField, form.form_fields)
    } else {
      return clonedField as LogicFieldResponse
    }
  })
}

const transformationErrorGenerator = (e: unknown) => {
  const message =
    hasProp(e, 'message') && typeof e.message === 'string'
      ? e.message
      : 'Something went wrong when processing submission for logic'
  return new ProcessingError(message)
}

export const getVisibleFieldIds = (
  submission: FieldResponse[],
  form: IFormDocument,
): Result<FieldIdSet, ProcessingError> => {
  const transformedSubmission = fromThrowable(
    adaptSubmissionForLogicModule,
    transformationErrorGenerator,
  )(submission, form)
  if (transformedSubmission.isErr()) {
    return err(transformedSubmission.error)
  }
  return ok(logicGetVisibleFieldIds(transformedSubmission.value, form))
}

export const getLogicUnitPreventingSubmit = (
  submission: FieldResponse[],
  form: IFormDocument,
  visibleFieldIds?: FieldIdSet,
): Result<IPreventSubmitLogicSchema | undefined, ProcessingError> => {
  const transformedSubmission = fromThrowable(
    adaptSubmissionForLogicModule,
    transformationErrorGenerator,
  )(submission, form)
  if (transformedSubmission.isErr()) {
    return err(transformedSubmission.error)
  }
  return ok(
    logicGetLogicUnitPreventingSubmit(
      transformedSubmission.value,
      form,
      visibleFieldIds,
    ),
  )
}
