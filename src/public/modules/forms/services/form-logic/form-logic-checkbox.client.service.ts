import { omit } from 'lodash'

import {
  IConditionSchema,
  IField,
  LogicCheckboxCondition,
} from '../../../../../types'
import { isCheckboxField } from '../../../../../types/field/utils/guards'

/**
 * Converts checkbox condition value with backend representation to frontend 2D array representation.
 * @param conditionValue Backend representation of checkbox logic condition value
 * @param field Corresponding checkbox field
 * @returns Transformed logic condition with frontend representation
 */
export const convertObjectCheckboxCondition = (
  condition: LogicCheckboxCondition,
): ClientCheckboxCondition => {
  const convertedValue = condition.value.map((value) => {
    if (value.others) {
      value.options.push('Others')
    }
    return value.options
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
  field: IField | undefined,
): LogicCheckboxCondition => {
  const convertedValue = condition.value.map((options) => {
    if (!field) {
      // eslint-disable-next-line typesafe/no-throw-sync-func
      throw new Error('Field is undefined')
    }
    if (!isCheckboxField(field)) {
      // eslint-disable-next-line typesafe/no-throw-sync-func
      throw new Error(`${JSON.stringify(field)} is not a checkbox field`)
    }
    const shouldHaveOthers = field.othersRadioButton
    const indexOfOthers = options.indexOf('Others')
    const others = shouldHaveOthers && indexOfOthers > -1
    if (others) {
      options.splice(indexOfOthers, 1)
    }
    return { options, others }
  })
  return {
    ...omit(condition, ['value']),
    value: convertedValue,
  }
}

// exported for testing
export interface ClientCheckboxCondition
  extends Omit<IConditionSchema, 'value'> {
  value: string[][]
}

export const isClientCheckboxCondition = (
  condition: IConditionSchema,
): condition is ClientCheckboxCondition => {
  const conditionValue = condition.value
  return (
    Array.isArray(conditionValue) &&
    (conditionValue as unknown[]).every((val) => {
      return (
        Array.isArray(val) && val.every((option) => typeof option === 'string')
      )
    })
  )
}
