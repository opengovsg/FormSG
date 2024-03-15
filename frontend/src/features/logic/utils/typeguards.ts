import { DeepPartial } from 'react-hook-form'

import { BasicField } from '~shared/types/field'
import { LogicableField } from '~shared/types/form'

import { FormFieldValue } from '~templates/Field'

import { ALLOWED_LOGIC_FIELDS } from '../constants'

type SingleAnswerLogicableField = Exclude<LogicableField, BasicField.Radio>

export const isLogicableField = (args: {
  fieldType: BasicField
  input: DeepPartial<FormFieldValue>
}): args is
  | {
      fieldType: SingleAnswerLogicableField
      input: FormFieldValue<SingleAnswerLogicableField>
    }
  | {
      fieldType: BasicField.Radio
      input: FormFieldValue<BasicField.Radio>
    } => {
  return ALLOWED_LOGIC_FIELDS.has(args.fieldType)
}

export const isNotLogicableField = (args: {
  fieldType: BasicField
  input: DeepPartial<FormFieldValue>
}): args is {
  fieldType: Exclude<BasicField, LogicableField>
  input: DeepPartial<FormFieldValue>
} => {
  return !isLogicableField(args)
}

export const isNotNull = <T>(arg: T): arg is Exclude<T, null> => arg !== null
