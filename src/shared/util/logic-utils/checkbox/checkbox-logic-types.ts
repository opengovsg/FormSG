import {
  CheckboxConditionValue,
  ICheckboxResponse,
  IClientConditionSchema,
  IConditionSchema,
} from '../../../../types'

/**
 * Types for checkbox logic field
 */

// Representation of backend checkbox response after being transformed
export type ILogicCheckboxResponse = Omit<ICheckboxResponse, 'answerArray'> & {
  answerArray: CheckboxConditionValue
}

// Representation of backend/logic checkbox condition
export interface LogicCheckboxCondition
  extends Omit<IConditionSchema, 'value'> {
  value: CheckboxConditionValue[]
}

// Representation of an option in the logic tab
export type ClientCheckboxConditionOption = {
  value: string
  other: boolean
}

// Representation of frontend checkbox condition
export interface ClientCheckboxCondition
  extends Omit<IClientConditionSchema, 'value'> {
  value: ClientCheckboxConditionOption[][]
}
