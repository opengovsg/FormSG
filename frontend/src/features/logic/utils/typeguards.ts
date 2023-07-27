import { DeepPartial } from 'react-hook-form'

import { BasicField } from '~shared/types/field'
import {
  FormCondition,
  LogicableField,
  LogicDto,
  LogicType,
  PreventSubmitLogicDto,
  ShowFieldLogicDto,
} from '~shared/types/form'

import { FormFieldValue } from '~templates/Field'

import { ALLOWED_LOGIC_FIELDS } from '../constants'

export const isShowFieldsLogic = (
  formLogic: LogicDto,
): formLogic is ShowFieldLogicDto => {
  return formLogic.logicType === LogicType.ShowFields
}

export const isPreventSubmitLogic = (
  formLogic: LogicDto,
): formLogic is PreventSubmitLogicDto => {
  return formLogic.logicType === LogicType.PreventSubmit
}

export const isRadioFormFieldValue = <F extends BasicField>(
  value: DeepPartial<FormFieldValue<LogicableField>>,
  fieldType: F,
): value is FormFieldValue<BasicField.Radio> => {
  return fieldType === BasicField.Radio && value !== undefined
}
export const isLogicableField = (args: {
  fieldType: BasicField
  input: DeepPartial<FormFieldValue>
}): args is {
  fieldType: LogicableField
  input: FormFieldValue<LogicableField>
} => {
  return ALLOWED_LOGIC_FIELDS.has(args.fieldType)
}

export const isValueStringArray = (
  value: FormCondition['value'],
): value is string[] => {
  // use .some because of limitation of typescript in calling .every() on union of array types: https://github.com/microsoft/TypeScript/issues/44373
  return Array.isArray(value) && !value.some((v) => typeof v === 'number')
}
