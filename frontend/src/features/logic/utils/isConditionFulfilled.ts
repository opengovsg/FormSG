import { DeepPartial } from 'react-hook-form'

import { BasicField } from '~shared/types/field'
import {
  FormCondition,
  LogicableField,
  LogicConditionState,
} from '~shared/types/form'

import { FormFieldValue } from '~templates/Field'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/RadioField'

import {
  isLogicableField,
  isRadioFormFieldValue,
  isValueStringArray,
} from './typeguards'

const getCurrentFieldValue = (
  input: DeepPartial<FormFieldValue<LogicableField>>,
  fieldType: LogicableField,
) => {
  switch (fieldType) {
    case BasicField.Radio:
    case BasicField.Number:
    case BasicField.Decimal:
    case BasicField.Dropdown:
    case BasicField.Rating:
    case BasicField.YesNo:
      return input
  }
}

/**
 * Utility function to trim condition.value strings
 * Trim logic condition for backward compability as some logic conditions have trailing whitespac
 * Similar to current implementation in `src/shared/util/logic.ts` for backend
 * TODO #4279: Revisit decision to trim after React rollout is complete
 */
const trimConditionValue = (condition: FormCondition) => {
  if (isValueStringArray(condition.value)) {
    return {
      ...condition,
      value: condition.value.map((value) => value.trim()),
    }
  } else if (typeof condition.value === 'string') {
    return {
      ...condition,
      value: condition.value.trim(),
    }
  } else {
    return condition
  }
}

export const isConditionFulfilled = (
  input: DeepPartial<FormFieldValue>,
  condition: FormCondition,
  fieldType: BasicField,
): boolean => {
  const conditionTrimmed = trimConditionValue(condition)

  // Not logic field, early return.
  const args = { fieldType, input }
  if (!isLogicableField(args)) return false

  // TODO #4279: Revisit decision to trim after React rollout is complete
  let currentValueTrimmed
  const currentValue = getCurrentFieldValue(args.input, args.fieldType)
  if (currentValue === '') {
    return false
  }
  if (typeof currentValue === 'string') {
    currentValueTrimmed = currentValue.trim()
  } else if (typeof currentValue.value === 'string') {
    currentValueTrimmed = {
      ...currentValue,
      value: currentValue.value.trim(),
    }
  } else {
    currentValueTrimmed = currentValue
  }

  switch (conditionTrimmed.state) {
    case LogicConditionState.Lte:
      return Number(currentValueTrimmed) <= Number(conditionTrimmed.value)
    case LogicConditionState.Gte:
      return Number(currentValueTrimmed) >= Number(conditionTrimmed.value)
    case LogicConditionState.Either: {
      // currentValue must be in a value in condition.value
      const condValuesArray = Array.isArray(conditionTrimmed.value)
        ? conditionTrimmed.value.map(String)
        : [String(conditionTrimmed.value)]
      if (isRadioFormFieldValue(currentValueTrimmed, args.fieldType)) {
        if (condValuesArray.includes('Others')) {
          // If the condition value is 'Others',
          // then the condition must be satisfied if the current value is the special input value AND
          // if the othersInput subfield has a value.
          const satisfiesOthers =
            currentValueTrimmed.value === RADIO_OTHERS_INPUT_VALUE &&
            !!currentValueTrimmed.othersInput
          if (satisfiesOthers) return true
        }
        return condValuesArray.includes(String(currentValueTrimmed.value))
      }
      return condValuesArray.includes(String(currentValueTrimmed))
    }
    case LogicConditionState.Equal: {
      if (isRadioFormFieldValue(currentValueTrimmed, args.fieldType)) {
        // It's possible that the condition.value is in a single-valued array.
        const condValue = Array.isArray(conditionTrimmed.value)
          ? conditionTrimmed.value[0]
          : conditionTrimmed.value
        if (
          condValue === 'Others' &&
          currentValueTrimmed.value === RADIO_OTHERS_INPUT_VALUE
        ) {
          // If the condition value is 'Others', then the condition must be
          // satisfied if the current value is the special input value.
          // Otherwise, we still fall through in case the 'Others' was a custom
          // value created by the user.
          return true
        }
        return String(condValue) === String(currentValueTrimmed.value)
      }
      // In angular, number equality is string=== but decimal equality is number===.
      // Need to replicate this behavior for backward-compatibility.
      if (fieldType === BasicField.Decimal) {
        return Number(currentValueTrimmed) === Number(conditionTrimmed.value)
      }
      return String(conditionTrimmed.value) === String(currentValueTrimmed)
    }
  }
}
