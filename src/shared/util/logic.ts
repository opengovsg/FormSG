// TODO: Import shared code from shared/logic.ts when possible.
import {
  BasicField,
  FieldBase,
  LogicConditionState,
} from '../../../shared/types'
import { LogicCondition } from '../../types'

const LOGIC_CONDITIONS: LogicCondition[] = [
  [
    BasicField.Dropdown,
    [LogicConditionState.Equal, LogicConditionState.Either],
  ],
  [
    BasicField.Number,
    [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  ],
  [
    BasicField.Decimal,
    [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  ],
  [
    BasicField.Rating,
    [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  ],
  [BasicField.YesNo, [LogicConditionState.Equal]],
  [BasicField.Radio, [LogicConditionState.Equal, LogicConditionState.Either]],
]

export const LOGIC_MAP = new Map<BasicField, LogicConditionState[]>(
  LOGIC_CONDITIONS,
)

/**
 * Given a list of form fields, returns only the fields that are
 * allowed to be present in the if-condition dropdown in the Logic tab.
 */
export const getApplicableIfFields = (formFields: FieldBase[]): FieldBase[] =>
  formFields.filter((field) => !!LOGIC_MAP.get(field.fieldType))

/**
 * Given a single form field type, returns the applicable logic states for that field type.
 */
export const getApplicableIfStates = (
  fieldType: BasicField,
): LogicConditionState[] => LOGIC_MAP.get(fieldType) ?? []
