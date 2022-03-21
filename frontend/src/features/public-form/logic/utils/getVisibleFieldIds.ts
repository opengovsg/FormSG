import { intersection } from 'lodash'
import { CamelCasedProperties } from 'type-fest'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormCondition, FormDto, LogicConditionState } from '~shared/types/form'

import { CHECKBOX_OTHERS_INPUT_VALUE } from '~templates/Field/Checkbox/CheckboxField'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/RadioField'

import {
  validateCheckboxInput,
  validateDateInput,
  validateRadioInput,
  validateSingleAnswerInput,
  validateVerifiableInput,
} from '~features/public-form/utils'

import { FieldIdSet, FieldIdToType } from '../types'

import { groupLogicUnitsByField } from './groupLogicUnitsByField'

const getCurrentFieldValue = (input: unknown, fieldType: BasicField) => {
  switch (fieldType) {
    case BasicField.Checkbox:
      return validateCheckboxInput(input) ? input : null
    case BasicField.Radio:
      return validateRadioInput(input) ? input : null
    case BasicField.Email:
    case BasicField.Mobile:
      return validateVerifiableInput(input) ? input.value : null
    case BasicField.Date:
      return validateDateInput(input) ? input : null
    case BasicField.Number:
    case BasicField.Decimal:
    case BasicField.ShortText:
    case BasicField.LongText:
    case BasicField.HomeNo:
    case BasicField.Dropdown:
    case BasicField.Rating:
    case BasicField.Nric:
    case BasicField.Uen:
    case BasicField.YesNo:
      return validateSingleAnswerInput(input) ? input : null
    case BasicField.Attachment:
    case BasicField.Statement:
    case BasicField.Section:
    case BasicField.Image:
    case BasicField.Table:
      // Field types not used for logic.
      return null
  }
}

const toArray = <T>(value: T | T[]): T[] => {
  return Array.isArray(value) ? value : [value]
}

const isConditionFulfilled = (
  input: unknown,
  condition: FormCondition,
  fieldType: BasicField,
): boolean => {
  const currentValue = getCurrentFieldValue(input, fieldType)
  if (currentValue === null) return false

  switch (condition.state) {
    case LogicConditionState.Lte:
      return Number(currentValue) <= Number(condition.value)
    case LogicConditionState.Gte:
      return Number(currentValue) >= Number(condition.value)
    case LogicConditionState.Either: {
      // currentValue must be in a value in condition.value
      const condValuesArray = toArray(condition.value)
      if (validateCheckboxInput(currentValue)) {
        // Empty value, automatically does not fulfil condition.
        if (!currentValue.value) {
          return false
        }
        if (condValuesArray.includes('Others')) {
          // If the condition value is 'Others',
          // then the condition must be satisfied if the current value is the special input value AND
          // if the othersInput subfield has a value.
          const satisfiesOthers =
            currentValue.value.includes(CHECKBOX_OTHERS_INPUT_VALUE) &&
            !!currentValue.othersInput
          if (satisfiesOthers) return true
        }
        // Some condition value has been met by the checked values.
        return intersection(condValuesArray, currentValue.value).length > 0
      }
      if (validateRadioInput(currentValue)) {
        if (condValuesArray.includes('Others')) {
          // If the condition value is 'Others',
          // then the condition must be satisfied if the current value is the special input value AND
          // if the othersInput subfield has a value.
          const satisfiesOthers =
            currentValue.value === RADIO_OTHERS_INPUT_VALUE &&
            !!currentValue.othersInput
          if (satisfiesOthers) return true
        }
        return condValuesArray.includes(currentValue.value)
      }
      return condValuesArray.includes(currentValue)
    }
    case LogicConditionState.Equal: {
      // Checkbox cannot have equal logic.
      // Condition values cannot be an array for equality logic.
      if (
        Array.isArray(condition.value) ||
        validateCheckboxInput(currentValue)
      ) {
        return false
      }
      if (validateRadioInput(currentValue)) {
        if (condition.value === 'Others') {
          // If the condition value is 'Others',
          // then the condition must be satisfied if the current value is the special input value AND
          // if the othersInput subfield has a value.
          return (
            currentValue.value === RADIO_OTHERS_INPUT_VALUE &&
            !!currentValue.othersInput
          )
        }
        return condition.value === currentValue.value
      }
      return String(condition.value) === currentValue
    }
  }
}

/**
 * Checks if an array of conditions is satisfied.
 * @param formInputs the inputs to the form to retrieve logic units for.
 * @param logicUnit the logic units to check.
 * @param visibleFieldMap the map with visible field ids as keys, which is used to ensure that conditions are visible
 * @returns true if all the conditions are satisfied, false otherwise
 */
const isLogicUnitSatisfied = (
  formInputs: Record<FormFieldDto['_id'], unknown>,
  logicUnit: FormCondition[],
  visibleFieldMap: FieldIdToType,
): boolean => {
  return logicUnit.every((condition) => {
    const inputFieldType = visibleFieldMap[condition.field]
    // If the field is not visible, then the field type will not be in the map.
    if (!inputFieldType) return false
    const input = formInputs[condition.field]
    return (
      input !== undefined &&
      isConditionFulfilled(input, condition, inputFieldType)
    )
  })
}

/**
 * Gets the IDs of visible fields in a form according to its responses.
 * This function loops through all the form fields until the set of visible
 * fields no longer changes. The first loop adds all the fields with no
 * conditions attached, the second adds fields which are made visible due to fields added in the previous loop, and so on.
 * @param formInputs the field responses to retrieve logic units for.
 * @param formProps the form fields and form logics to determine visible field ids.
 * @returns a set of IDs of visible fields in the submission
 */
export const getVisibleFieldIds = (
  formInputs: Record<FormFieldDto['_id'], unknown>,
  {
    formFields,
    formLogics,
  }: CamelCasedProperties<Pick<FormDto, 'form_fields' | 'form_logics'>>,
): FieldIdSet => {
  const idToFieldTypeMap = formFields.reduce<FieldIdToType>((acc, ff) => {
    acc[ff._id] = ff.fieldType
    return acc
  }, {})

  const { groupedLogic } = groupLogicUnitsByField(formLogics, idToFieldTypeMap)
  const visibleFieldMap: FieldIdToType = {}
  // Loop continues until no more changes made
  let changesMade = true
  while (changesMade) {
    changesMade = false
    // eslint-disable-next-line no-loop-func
    formFields.forEach((field) => {
      const logicUnits = groupedLogic[field._id]
      // If a field's visibility does not have any conditions, it is always
      // visible.
      // Otherwise, a field's visibility can be toggled by a combination of
      // conditions.
      // Eg. the following are logicUnits - just one of them has to be satisfied
      // 1) Show X if Y=yes and Z=yes
      // Or
      // 2) Show X if A=1
      if (
        !visibleFieldMap[field._id] &&
        (!logicUnits ||
          logicUnits.some((logicUnit) =>
            isLogicUnitSatisfied(formInputs, logicUnit, visibleFieldMap),
          ))
      ) {
        visibleFieldMap[field._id] = field.fieldType
        changesMade = true
      }
    })
  }

  return new Set(Object.keys(visibleFieldMap))
}
