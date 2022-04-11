import { BasicField } from '../../types/field'
import { LogicCondition, LogicConditionState } from '../../types/form'

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
