import {
  BasicField,
  IField,
  LogicConditionState,
  LogicValidConditions,
} from '../../../../types'

const LOGIC_VALID_CONDITIONS: LogicValidConditions[] = [
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

export const getApplicableIfFields = (formFields: IField[]): IField[] =>
  formFields.filter((field) =>
    LOGIC_VALID_CONDITIONS.find(
      (validCondition) => validCondition.fieldType === field.fieldType,
    ),
  )

const FormLogic = {
  conditions: LOGIC_VALID_CONDITIONS,
  getApplicableIfFields,
}

export default FormLogic
