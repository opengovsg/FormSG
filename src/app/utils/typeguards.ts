import { LOGIC_MAP } from '../../../shared/modules/logic'
import {
  BasicField,
  FieldResponseAnswerMapV3,
  LogicableField,
  RadioFieldResponsesV3,
  StringAnswerResponseV3,
} from '../../../shared/types'

type SingleAnswerLogicableField = Exclude<LogicableField, BasicField.Radio>

export const isLogicableField = (args: {
  fieldType: BasicField
  input: FieldResponseAnswerMapV3<BasicField>
}): args is
  | {
      fieldType: SingleAnswerLogicableField
      input: StringAnswerResponseV3
    }
  | {
      fieldType: BasicField.Radio
      input: RadioFieldResponsesV3
    } => {
  return [...LOGIC_MAP.keys()].includes(args.fieldType)
}

export const isNotLogicableField = (args: {
  fieldType: BasicField
  input: FieldResponseAnswerMapV3<BasicField>
}): args is {
  fieldType: Exclude<BasicField, LogicableField>
  input: FieldResponseAnswerMapV3<BasicField>
} => {
  return !isLogicableField(args)
}
