import {
  AttachmentResponse,
  CheckboxResponse,
  DateResponse,
  DecimalResponse,
  DropdownResponse,
  EmailResponse,
  FieldResponse,
  HeaderResponse,
  HomeNoResponse,
  LongTextResponse,
  MobileResponse,
  NricResponse,
  NumberResponse,
  RadioResponse,
  RatingResponse,
  ShortTextResponse,
  TableResponse,
  UenResponse,
  YesNoResponse,
} from '../../../shared/types/response'
import { BasicField } from '../../types'

import { FormSgSdk } from './FormSgSdkService'

/**
 * Encrypts given submission responses with the public key.
 * @param responses the responses to encrypt
 * @param publicKey the public key to encrypt with
 * @returns the encrypted responses
 * @throws error if the given responses are malformed
 */
export const encryptSubmissionResponses = (
  responses: unknown,
  publicKey: string,
): string => {
  return FormSgSdk.crypto.encrypt(validateResponses(responses), publicKey)
}

const isPossibleResponse = (
  o: unknown,
): o is Record<string, unknown> & { fieldType: BasicField } => {
  const isPossibleObject = typeof o === 'object' && o !== null
  if (!isPossibleObject) return false

  return !!(o as Record<string, unknown>).fieldType
}

const validateResponses = (responses: unknown): FieldResponse[] => {
  if (!Array.isArray(responses)) {
    throw new Error('Input submission is malformed')
  }

  return responses.map((response) => {
    if (!isPossibleResponse(response)) {
      throw new Error('Input shape not a response')
    }

    switch (response.fieldType) {
      case BasicField.Section:
        return HeaderResponse.parse(response)
      case BasicField.Mobile:
        return MobileResponse.parse(response)
      case BasicField.Decimal:
        return DecimalResponse.parse(response)
      case BasicField.Attachment:
        return AttachmentResponse.parse(response)
      case BasicField.Checkbox:
        return CheckboxResponse.parse(response)
      case BasicField.Date:
        return DateResponse.parse(response)
      case BasicField.Dropdown:
        return DropdownResponse.parse(response)
      case BasicField.Email:
        return EmailResponse.parse(response)
      case BasicField.HomeNo:
        return HomeNoResponse.parse(response)
      case BasicField.LongText:
        return LongTextResponse.parse(response)
      case BasicField.Nric:
        return NricResponse.parse(response)
      case BasicField.Rating:
        return RatingResponse.parse(response)
      case BasicField.Radio:
        return RadioResponse.parse(response)
      case BasicField.ShortText:
        return ShortTextResponse.parse(response)
      case BasicField.Table:
        return TableResponse.parse(response)
      case BasicField.Uen:
        return UenResponse.parse(response)
      case BasicField.Number:
        return NumberResponse.parse(response)
      case BasicField.YesNo:
        return YesNoResponse.parse(response)
      default:
        throw new Error(
          `Invalid fieldType provided for encrypt submission validation: ${response.fieldType}`,
        )
    }
  })
}
