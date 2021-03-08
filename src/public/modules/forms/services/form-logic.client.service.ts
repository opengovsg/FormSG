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

/**
 * Given a list of form fields, returns only the elements that are
 * allowed to be present in the if-condition dropdown in the Logic tab.
 * @param formFields
 * @returns
 */
export const getApplicableIfFields = (formFields: IField[]): IField[] =>
  formFields.filter((field) =>
    LOGIC_VALID_CONDITIONS.find(
      (validCondition) => validCondition.fieldType === field.fieldType,
    ),
  )

export const conditions = LOGIC_VALID_CONDITIONS
