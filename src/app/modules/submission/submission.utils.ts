import { BasicField, ResponseMode } from '../../../types'
import { FIELDS_TO_REJECT } from '../../utils/field-validation/config'

type ModeFilterParam = {
  fieldType: BasicField
}

export const getModeFilter = (responseMode: ResponseMode) => {
  switch (responseMode) {
    case ResponseMode.Email:
      return emailModeFilter
    case ResponseMode.Encrypt:
      return encryptModeFilter
    default:
      throw Error('getResponsesForEachField: Invalid response mode parameter')
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
