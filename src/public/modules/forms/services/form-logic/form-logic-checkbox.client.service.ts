import { omit } from 'lodash'

import {
  ClientCheckboxConditionOption,
  IConditionSchema,
  LogicCheckboxCondition,
} from '../../../../../types'

/**
 * Converts checkbox condition value with backend representation to frontend 2D array representation.
 * @param conditionValue Backend representation of checkbox logic condition value
 * @param field Corresponding checkbox field
 * @returns Transformed logic condition with frontend representation
 */
export const convertObjectCheckboxCondition = (
  condition: LogicCheckboxCondition,
): ClientCheckboxCondition => {
  const convertedValue: ClientCheckboxConditionOption[][] = []
  condition.value.forEach((value) => {
    const combination = []
    if (value.others) {
      combination.push({ value: 'Others', other: true })
    }
    value.options.forEach((option) => {
      combination.push({ value: option, other: false })
    })
    convertedValue.push(combination)
  })
  return {
    ...omit(condition, ['value']),
    value: convertedValue,
  }
}

/**
 * Converts checkbox condition with frontend 2D array representation to backend object representation.
 * @param conditionValue Frontend representation of checkbox logic condition value
 * @param field Corresponding checkbox field
 * @throws Error if checkbox field does not have othersRadioButton key
 * @returns Transformed logic condition with backend representation
 */
export const convertArrayCheckboxCondition = (
  condition: ClientCheckboxCondition,
): LogicCheckboxCondition => {
  const convertedValue = condition.value.map((options) => {
    const indexOfOthers = options.findIndex((option) => option.other)
    const others = indexOfOthers > -1
    if (others) {
      options.splice(indexOfOthers, 1)
    }
    return { options: options.map((option) => option.value), others }
  })
  return {
    ...omit(condition, ['value']),
    value: convertedValue,
  }
}

// exported for testing
export interface ClientCheckboxCondition
  extends Omit<IConditionSchema, 'value'> {
  value: ClientCheckboxConditionOption[][]
}

export const isClientCheckboxCondition = (
  condition: IConditionSchema,
): condition is ClientCheckboxCondition => {
  const conditionValue = condition.value
  return (
    Array.isArray(conditionValue) &&
    (conditionValue as unknown[]).every((val) => {
      return (
        Array.isArray(val) &&
        val.every(
          (option) =>
            typeof option.value === 'string' &&
            typeof option.other === 'boolean',
        )
      )
    })
  )
}
