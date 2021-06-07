import {
  DecryptedContent,
  FormField as VerifiedFormField,
} from '@opengovsg/formsg-sdk/dist/types'
import has from 'lodash/has'

import {
  CURRENT_VERIFIED_FIELDS,
  VerifiedKeys,
} from '../../../../shared/util/verified-content'
import { BasicField, SPCPFieldTitle } from '../../../../types'

/**
 * Returns a response matching the given type containing the given value.
 * @param type the field type to match
 * @param value the value to insert into the response to be returned
 * @returns the desired response object if type is valid. Else returns null.
 */
const getResponseFromVerifiedField = (
  type: VerifiedKeys,
  value: string,
): VerifiedFormField | null => {
  switch (type) {
    case VerifiedKeys.SpUinFin:
      return {
        question: SPCPFieldTitle.SpNric,
        fieldType: BasicField.Nric,
        answer: value,
        // Just a unique identifier for CSV header uniqueness
        _id: SPCPFieldTitle.SpNric,
      }

    case VerifiedKeys.CpUen:
      return {
        question: SPCPFieldTitle.CpUen,
        fieldType: BasicField.ShortText,
        answer: value,
        _id: SPCPFieldTitle.CpUen,
      }

    case VerifiedKeys.CpUid:
      return {
        question: SPCPFieldTitle.CpUid,
        fieldType: BasicField.Nric,
        answer: value,
        _id: SPCPFieldTitle.CpUid,
      }
    default:
      return null
  }
}

/**
 * Converts a decrypted verified object into an array with the same shape as the
 * current decrypted content to be concatenated with the decrypted content.
 * NOTE: This function assumes verifiedObj is an object with simple string
 * key-value pairs.
 * @param verifiedObj the object to convert
 * @returns the converted array.
 */
const convertToResponseArray = (
  verifiedObj: Record<string, string>,
): VerifiedFormField[] => {
  return CURRENT_VERIFIED_FIELDS.filter((fieldType) =>
    has(verifiedObj, fieldType),
  )
    .map((fieldType) =>
      getResponseFromVerifiedField(fieldType, verifiedObj[fieldType]),
    )
    .filter((field): field is VerifiedFormField => {
      return !!field
    })
}

/**
 * Processes the decrypted content containing the previously encrypted responses
 * and verified content, and combines them into a single response array.
 * @param decrypted.responses the previously encrypted responses content
 * @param decrypted.verified the previously encrypted verified content,if it exists
 * @returns the processed content
 */
export const processDecryptedContent = (
  decrypted: DecryptedContent,
): VerifiedFormField[] => {
  const { responses: displayedContent, verified } = decrypted
  // Convert decrypted content into displayable object.

  return verified
    ? displayedContent.concat(convertToResponseArray(verified))
    : displayedContent
}
