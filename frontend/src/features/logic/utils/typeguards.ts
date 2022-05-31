import { DeepPartial } from 'react-hook-form'

import { BasicField } from '~shared/types/field'
import {
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
