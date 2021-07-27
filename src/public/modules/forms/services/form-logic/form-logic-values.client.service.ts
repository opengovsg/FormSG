import {
  IField,
  LogicConditionState,
  NumberSelectedValidation,
} from '../../../../../types'
import {
  isCheckboxField,
  isDecimalField,
  isDropdownField,
  isNumberField,
  isRadioButtonField,
  isRatingField,
} from '../../helpers/logic-field-guards'

import { IClientConditionSchema } from './form-logic.client.service'
import {
  ClientCheckboxCondition,
  isClientCheckboxConditionValue,
} from './form-logic-checkbox.client.service'

/**
 * Checks if any of the values specified in logic are invalid.
 * @param values Condition values.
 * @param field Field with corresponding condition values.
 * @param state Condition state
 * @returns If the values are invalid
 */
export const checkIfHasInvalidValues = (
  values: IClientConditionSchema['value'],
  field: IField,
  state: LogicConditionState,
): boolean => {
  if (
    !field ||
    !state ||
    !values ||
    ((Array.isArray(values) || typeof values === 'string') &&
      values.length === 0)
  ) {
    // if field, state, value has not been chosen has not been chosen, no error
    return false
  }
  if (
    (isDropdownField(field) || isRadioButtonField(field)) &&
    isStringConditionValues(values)
  ) {
    const flattenedValues = ([] as string[])
      .concat(values)
      .reduce((options, val) => {
        return options.concat(val)
      }, [] as string[])

    return flattenedValues.some((val) => {
      if (field.fieldOptions.includes(val)) {
        return false
      }
      if (isRadioButtonField(field)) {
        return val === 'Others' && !field.othersRadioButton
      }
      return true
    })
  } else if (isCheckboxField(field) && isClientCheckboxConditionValue(values)) {
    const flattenedValues = ([] as ClientCheckboxCondition['value'])
      .concat(values)
      .reduce((options, val) => {
        return options.concat(val)
      }, [])
    return flattenedValues.some((val) => {
      if (val.other) {
        return !field.othersRadioButton
      }
      return !field.fieldOptions.includes(val.value)
    })
  } else if (isRatingField(field)) {
    return values > field.ratingOptions.steps
  } else if (isDecimalField(field)) {
    const min = field.ValidationOptions.customMin
    const max = field.ValidationOptions.customMax
    const belowMin = min ? values < min : false
    const aboveMax = max ? max < values : false
    if (state === LogicConditionState.Lte) {
      return belowMin
    } else if (state === LogicConditionState.Gte) {
      return aboveMax
    } else {
      return belowMin || aboveMax
    }
  } else if (isNumberField(field)) {
    if (!field.ValidationOptions.selectedValidation) {
      return false
    }

    const min =
      field.ValidationOptions.selectedValidation ===
      NumberSelectedValidation.Min
        ? field.ValidationOptions.customVal
        : null
    const max =
      field.ValidationOptions.selectedValidation ===
      NumberSelectedValidation.Max
        ? field.ValidationOptions.customVal
        : null
    const exact =
      field.ValidationOptions.selectedValidation ===
      NumberSelectedValidation.Exact
        ? field.ValidationOptions.customVal
        : null

    const belowMin = min ? values < min : false
    const aboveMax = max ? max < values : false
    const belowExact = exact ? values < exact : false
    const aboveExact = exact ? values > exact : false
    if (state === LogicConditionState.Lte) {
      return belowMin || belowExact
    } else if (state === LogicConditionState.Gte) {
      return aboveMax || aboveExact
    } else {
      return belowMin || aboveMax || belowExact || aboveExact
    }
  } else {
    return false
  }
}

const isStringConditionValues = (
  values: IClientConditionSchema['value'],
): values is string | string[] => {
  if (Array.isArray(values)) {
    return (values as unknown[]).every((val) => typeof val === 'string')
  } else {
    return typeof values === 'string'
  }
}
