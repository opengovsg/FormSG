import { BasicField, FormFieldDto } from '../types'

import { LogicFieldClientRadioResponseInput, LogicFieldResponse } from './logic'
import {
  FieldResponsesV4Input,
  RadioAnswerV4,
  StringAnswerV4,
} from './v4-answer'

/**
 * Special case for radio field type `Others` selection,
 * in the shape the logic evaluator expects.
 */
const toRadioLogicInput = (
  answer: RadioAnswerV4,
): LogicFieldClientRadioResponseInput =>
  answer.isOthersInput ? { othersInput: answer.value } : { value: answer.value }

export const fieldResponsesV4ToLogicFieldResponseTransformer = (
  v4Responses: FieldResponsesV4Input,
  formFields: FormFieldDto[],
): LogicFieldResponse[] => {
  const logicFields: LogicFieldResponse[] = []
  for (const field of formFields) {
    const answer = v4Responses[field._id]?.answer
    if (answer === undefined) continue
    switch (field.fieldType) {
      case BasicField.Radio:
        logicFields.push({
          _id: field._id,
          fieldType: field.fieldType,
          input: toRadioLogicInput(answer as RadioAnswerV4),
        })
        break
      case BasicField.Dropdown:
      case BasicField.YesNo:
      case BasicField.Number:
      case BasicField.Decimal:
      case BasicField.Rating:
        logicFields.push({
          _id: field._id,
          fieldType: field.fieldType,
          input: (answer as StringAnswerV4).value,
        })
        break
      default:
        logicFields.push({ _id: field._id, fieldType: field.fieldType })
    }
  }
  return logicFields
}
