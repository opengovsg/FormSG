import { CheckboxConditionValue } from '../../../../../shared/types/form/form_logic'
import { ICheckboxResponse, IConditionSchema } from '../../../../types'
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
