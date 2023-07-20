import { BasicField } from '~shared/types/field'
import { LogicConditionState, LogicIfValue } from '~shared/types/form'

type GetIfLogicTypeArgs = {
  fieldType: BasicField
  conditionState: LogicConditionState
}

export const getIfLogicType = ({
  fieldType,
  conditionState,
}: GetIfLogicTypeArgs) => {
  // Default logic block type
  if (!fieldType) return LogicIfValue.SingleSelect

  switch (fieldType) {
    case BasicField.Dropdown:
    case BasicField.Radio: {
      return conditionState === LogicConditionState.Equal
        ? LogicIfValue.SingleSelect
        : LogicIfValue.MultiSelect
    }
    case BasicField.Children:
    case BasicField.Rating:
    case BasicField.YesNo:
      return LogicIfValue.SingleSelect
    default:
      return LogicIfValue.Number
  }
}
