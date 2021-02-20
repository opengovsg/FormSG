import { BasicField, LogicConditionState } from '../../../../types'

type LogicValidConditions =
  | {
      fieldType: BasicField.Dropdown
      states: Array<LogicConditionState.Equal | LogicConditionState.Either>
    }
  | {
      fieldType: BasicField.Number
      states: Array<
        | LogicConditionState.Equal
        | LogicConditionState.Lte
        | LogicConditionState.Gte
      >
    }
  | {
      fieldType: BasicField.Decimal
      states: Array<
        | LogicConditionState.Equal
        | LogicConditionState.Lte
        | LogicConditionState.Gte
      >
    }
  | {
      fieldType: BasicField.Rating
      states: Array<
        | LogicConditionState.Equal
        | LogicConditionState.Lte
        | LogicConditionState.Gte
      >
    }
  | {
      fieldType: BasicField.YesNo
      states: Array<LogicConditionState.Equal>
    }
  | {
      fieldType: BasicField.Radio
      states: Array<LogicConditionState.Equal | LogicConditionState.Either>
    }

const conditions: LogicValidConditions[] = [
  {
    fieldType: BasicField.Dropdown,
    states: [LogicConditionState.Equal, LogicConditionState.Either],
  },
  {
    fieldType: BasicField.Number,
    states: [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  },
  {
    fieldType: BasicField.Decimal,
    states: [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  },
  {
    fieldType: BasicField.Rating,
    states: [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  },
  {
    fieldType: BasicField.YesNo,
    states: [LogicConditionState.Equal],
  },
  {
    fieldType: BasicField.Radio,
    states: [LogicConditionState.Equal, LogicConditionState.Either],
  },
]

const FormLogic = {
  conditions,
  fieldTypes: conditions.map(function (condition) {
    return condition.fieldType
  }),
}

export default FormLogic
