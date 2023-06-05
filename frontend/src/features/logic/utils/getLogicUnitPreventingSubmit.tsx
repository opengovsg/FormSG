import { DeepPartialSkipArrayKey, UnpackNestedValue } from 'react-hook-form'

import { FormCondition, FormDto, PreventSubmitLogicDto } from '~shared/types'

import { FormFieldValues } from '~templates/Field'

import { filterHiddenInputs } from '~features/public-form/utils'

import { FieldIdToType } from '../types'

import { allConditionsExist } from './allConditionsExist'
import { isConditionFulfilled } from './isConditionFulfilled'
import { isPreventSubmitLogic } from './typeguards'

/**
 * Parse logic to get a list of conditions where, if any condition in this list
 * is fulfilled, form submission is prevented.
 * @param formLogics the form logics to check
 * @param visibleFieldMap the map containing keys of visible field ids to check if the logic is fulfilled
 * @returns array of conditions that prevent submission, can be empty
 */
const getPreventSubmitConditions = (
  formLogics: FormDto['form_logics'],
  visibleFieldMap: FieldIdToType,
) => {
  return formLogics.filter(
    (formLogic): formLogic is PreventSubmitLogicDto =>
      isPreventSubmitLogic(formLogic) &&
      allConditionsExist(formLogic.conditions, visibleFieldMap),
  )
}

/**
 * Checks if an array of conditions is satisfied.
 * @param formInputs the responses to retrieve logic units for.
 * @param logicUnit an unit representing a single logic condition slice.
 * @param visibleFieldMap the map with keys of field IDs that are visible, which is used to ensure that conditions are visible
 * @returns true if all the conditions are satisfied, false otherwise
 */
const isLogicUnitSatisfied = (
  formInputs: UnpackNestedValue<DeepPartialSkipArrayKey<FormFieldValues>>,
  logicUnit: FormCondition[],
  fieldIdToType: FieldIdToType,
): boolean => {
  return logicUnit.every((condition) => {
    const conditionField = formInputs[condition.field]
    const conditionFieldType = fieldIdToType[condition.field]
    return (
      conditionField !== undefined &&
      !!conditionFieldType &&
      isConditionFulfilled(conditionField, condition, conditionFieldType)
    )
  })
}

/**
 * Determines whether the submission should be prevented by form logic. If so,
 * return the condition preventing the submission. If not, return undefined.
 * @param params.formInputs the responses to retrieve logic units for.
 * @param params.formLogics the logic conditions on the form
 * @param params.visibleFieldIds the set of currently visible fields id.
 * @returns a condition if submission is to prevented, otherwise `undefined`
 */
export const getLogicUnitPreventingSubmit = ({
  formFields,
  formInputs,
  formLogics,
}: {
  formFields: FormDto['form_fields']
  formLogics: FormDto['form_logics']
  formInputs: FormFieldValues
}) => {
  const filteredFormInputs = filterHiddenInputs({
    formFields,
    formInputs,
    formLogics,
  })

  const fieldIdToType = formFields.reduce<FieldIdToType>((acc, ff) => {
    acc[ff._id] = ff.fieldType
    return acc
  }, {})

  const preventSubmitConditions = getPreventSubmitConditions(
    formLogics,
    fieldIdToType,
  )
  return preventSubmitConditions.find((logicUnit) =>
    isLogicUnitSatisfied(
      filteredFormInputs,
      logicUnit.conditions,
      fieldIdToType,
    ),
  )
}
