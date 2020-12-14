import { keyBy } from 'lodash'

import { BasicField, IFieldSchema, ResponseMode } from '../../../types'
import { isEmailField } from '../../../types/field/utils/guards'
import { AutoReplyMailData } from '../../services/mail/mail.types'
import { assertUnreachable } from '../../utils/assert-unreachable'
import { FIELDS_TO_REJECT } from '../../utils/field-validation/config'

import { ProcessedFieldResponse } from './submission.types'

type ModeFilterParam = {
  fieldType: BasicField
}

export const getModeFilter = (
  responseMode: ResponseMode,
): (<T extends ModeFilterParam>(responses: T[]) => T[]) => {
  switch (responseMode) {
    case ResponseMode.Email:
      return emailModeFilter
    case ResponseMode.Encrypt:
      return encryptModeFilter
    default:
      return assertUnreachable(responseMode)
  }
}

const emailModeFilter = <T extends ModeFilterParam>(responses: T[]) => {
  return responses.filter(
    ({ fieldType }) => !FIELDS_TO_REJECT.includes(fieldType),
  )
}

const encryptModeFilter = <T extends ModeFilterParam>(responses: T[] = []) => {
  // To filter for autoreply-able fields.
  return responses.filter(({ fieldType }) =>
    [BasicField.Mobile, BasicField.Email].includes(fieldType),
  )
}

export const extractEmailConfirmationData = (
  parsedResponses: ProcessedFieldResponse[],
  formFields: IFieldSchema[] | undefined,
): AutoReplyMailData[] => {
  const fieldsById = keyBy(formFields, '_id')
  return parsedResponses.reduce((acc, response) => {
    const field = fieldsById[response._id]
    if (
      field &&
      isEmailField(field) &&
      response.fieldType === BasicField.Email &&
      response.answer
    ) {
      const options = field.autoReplyOptions
      if (options.hasAutoReply) {
        acc.push({
          email: response.answer,
          subject: options.autoReplySubject,
          sender: options.autoReplySender,
          body: options.autoReplyMessage,
          includeFormSummary: options.includeFormSummary,
        })
      }
    }
    return acc
  }, [] as AutoReplyMailData[])
}
