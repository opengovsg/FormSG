import {
  DecryptedContent,
  DecryptedContentV3,
  FormField as VerifiedFormField,
} from '@opengovsg/formsg-sdk/dist/types'

import {
  AttachmentFieldResponseV3,
  BasicField,
  FieldResponse,
  FormFieldDto,
} from 'formsg-shared/types'
import {
  SgidFieldTitle,
  SPCPFieldTitle,
  VerifiedKeys,
} from 'formsg-shared/utils/verified-content'

import {
  pickBaseOutputFromSchema,
  transformInputsToOutputs,
} from '~features/public-form/utils/inputTransformation'

/**
 * Returns a verifiedFormField matching the given verifiedKey containing the given value.
 * @param verifiedKey the field type to match
 * @param value the value to insert into the response to be returned
 * @returns the desired response object if type is valid. Else returns null.
 */
const getVerifiedFieldFromResponse = (
  singpassAuthType: VerifiedKeys | string,
  value: string,
): VerifiedFormField | null => {
  // Extract verifiedKey and optional step number (for MRF cases) from singpassAuthType
  const verifiedKeyMatch = singpassAuthType.match(
    /^(uinFin|cpUen|cpUid|sgidUinFin)(?: \(Step (\d+)\))?$/,
  )
  if (!verifiedKeyMatch) return null

  const [, verifiedKey] = verifiedKeyMatch

  switch (verifiedKey as VerifiedKeys) {
    case VerifiedKeys.SpUinFin:
      return {
        question: SPCPFieldTitle.SpNric,
        fieldType: BasicField.Nric,
        answer: value,
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

    case VerifiedKeys.SgidUinFin:
      return {
        question: SgidFieldTitle.SgidNric,
        fieldType: 'nric',
        answer: value,
        _id: SgidFieldTitle.SgidNric,
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
  return Object.keys(verifiedObj)
    .filter((key) =>
      Object.values(VerifiedKeys).some((baseKey) => key.startsWith(baseKey)),
    )
    .map((key) => getVerifiedFieldFromResponse(key, verifiedObj[key]))
    .filter((field): field is VerifiedFormField => !!field)
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

/**
 * Processes the decrypted content containing the previously encrypted responses
 * and verified content, and combines them into a single response array.
 * @param decrypted.responses the previously encrypted responses content
 * @param decrypted.verified the previously encrypted verified content,if it exists
 * @returns the processed content
 */
export const processDecryptedContentV3 = async (
  form_fields: FormFieldDto[],
  decrypted: DecryptedContentV3,
): Promise<VerifiedFormField[]> => {
  const { responses, verified } = decrypted
  // Convert decrypted content into displayable object.
  const displayedContent = form_fields
    .map((ff) => {
      const response = responses[ff._id]
      if (!response) {
        return transformInputsToOutputs(ff)
      }
      if (response.fieldType === BasicField.Attachment) {
        const answer = response.answer as AttachmentFieldResponseV3
        return {
          ...pickBaseOutputFromSchema(ff),
          answer: answer.answer,
        }
      }

      const decryptedResponse = transformInputsToOutputs(ff, response.answer)
      if (decryptedResponse && 'myInfo' in ff) {
        decryptedResponse.question = `[Myinfo] ${decryptedResponse.question} `
      }
      return decryptedResponse
    })
    .filter(
      (output): output is FieldResponse => output !== null,
    ) as VerifiedFormField[]
  return verified
    ? displayedContent.concat(convertToResponseArray(verified))
    : displayedContent
}
