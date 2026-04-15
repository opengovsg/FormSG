import {
  adaptV1ToV3,
  adaptV3ToV1,
  DecryptedContent,
  DecryptedContentV3,
  FormField as VerifiedFormField,
} from '@opengovsg/formsg-sdk'

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
} from '~features/public-form/utils'

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

  // TEST: Convert v1 responses to v3 format
  try {
    const v3Responses = adaptV1ToV3(displayedContent)
    console.log('V1 to V3 Conversion Test')
    console.log('V1 Responses:', JSON.stringify(displayedContent, null, 2))
    console.log('V3 Responses:', JSON.stringify(v3Responses, null, 2))
    console.log('V1 Count:', displayedContent.length)
    console.log('V3 Count:', Object.keys(v3Responses).length)
  } catch (error) {
    console.error('Error converting v1 to v3:', error)
  }

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

  // LOG: Actual V3 response schema
  console.log('V3 Response Schema:', JSON.stringify(responses, null, 2))
  console.log('V3 Response Count:', Object.keys(responses).length)

  // TEST: Convert v3 responses back to v1 format
  try {
    const v1Responses = adaptV3ToV1(responses, {
      formFields: form_fields,
    })
    console.log('V3 to V1 Conversion Test')
    console.log('V3 Responses:', JSON.stringify(responses, null, 2))
    console.log('V1 Responses:', JSON.stringify(v1Responses, null, 2))
    console.log('V3 Count:', Object.keys(responses).length)
    console.log('V1 Count:', v1Responses.length)
  } catch (error) {
    console.error('Error converting v3 to v1:', error)
  }

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
