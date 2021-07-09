import { isLogicCheckboxCondition } from '../../../../../shared/util/logic'
import {
  BasicField,
  IField,
  ILogicSchema,
  IPopulatedForm,
  LogicCondition,
  LogicConditionState,
} from '../../../../../types'

import {
  convertArrayCheckboxCondition,
  convertObjectCheckboxCondition,
  isClientCheckboxCondition,
} from './form-logic-checkbox.client.service'

const LOGIC_CONDITIONS: LogicCondition[] = [
  [BasicField.Checkbox, [LogicConditionState.AnyOf]],
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

const LOGIC_MAP = new Map<BasicField, LogicConditionState[]>(LOGIC_CONDITIONS)

/**
 * Given a list of form fields, returns only the fields that are
 * allowed to be present in the if-condition dropdown in the Logic tab.
 */
export const getApplicableIfFields = (formFields: IField[]): IField[] =>
  formFields.filter((field) => !!LOGIC_MAP.get(field.fieldType))

/**
 * Given a single form field type, returns the applicable logic states for that field type.
 */
export const getApplicableIfStates = (
  fieldType: BasicField,
): LogicConditionState[] => LOGIC_MAP.get(fieldType) ?? []

/**
 * Transforms logic conditions retrieved from the backend into frontend representation.
 * This function should be used when retrieving logic objects from the backend.
 * @param formLogic Logic object
 * @returns Transformed logic object
 */
export const transformBackendLogic = (
  formLogic: ILogicSchema,
): ILogicSchema => {
  formLogic.conditions = formLogic.conditions.map((condition) => {
    if (isLogicCheckboxCondition(condition)) {
      return convertObjectCheckboxCondition(condition)
    } else {
      return condition
    }
  })

  return formLogic
}

/**
 * Transforms logic conditions retrieved from the frontend into backend representation.
 * This function should be used before sending logic objects to the backend.
 * @param formLogic Logic object
 * @param formFields Form fields of the form.
 * @returns Tranformed logic object
 */
export const transformFrontendLogic = (
  formLogic: ILogicSchema,
  formFields: IPopulatedForm['form_fields'],
): ILogicSchema => {
  formLogic.conditions = formLogic.conditions.map((condition) => {
    if (isClientCheckboxCondition(condition)) {
      const conditionField = formFields.find(
        (field) => String(field._id) === String(condition.field),
      )
      return convertArrayCheckboxCondition(condition, conditionField)
    } else {
      return condition
    }
  })
  return formLogic
}
