import {
  DecryptedContent,
  FieldResponsesV4,
  FormField as VerifiedFormField,
  FormFieldMeta,
} from '@opengovsg/formsg-sdk'

import { BasicField, FormFieldDto, LogicDto } from 'formsg-shared/types'
import { flattenV4ToFormFields } from 'formsg-shared/utils/flatten-v4-to-v1'
import {
  placeVerifiedFieldsByStep,
  StepFieldList,
} from 'formsg-shared/utils/place-verified-by-step'
import {
  getVerifiedFieldTitle,
  parseVerifiedKey,
  VerifiedKeys,
} from 'formsg-shared/utils/verified-content'

const VERIFIED_FIELD_TYPES: Record<
  VerifiedKeys,
  VerifiedFormField['fieldType']
> = {
  [VerifiedKeys.SpUinFin]: BasicField.Nric,
  [VerifiedKeys.CpUen]: BasicField.ShortText,
  [VerifiedKeys.CpUid]: BasicField.Nric,
  [VerifiedKeys.SgidUinFin]: BasicField.Nric,
}

/**
 * Returns a verifiedFormField matching the given verifiedKey containing the given value.
 * The title doubles as the synthetic _id; MRF steps after Step 1 keep their
 * ` (Step N)` suffix so each respondent's identity stays distinct.
 * @param verifiedKey the verifiedContent key, optionally with MRF step suffix
 * @param value the value to insert into the response to be returned
 * @returns the desired response object if key is valid. Else returns null.
 */
const getVerifiedFieldFromResponse = (
  verifiedKey: string,
  value: string,
): VerifiedFormField | null => {
  const parsed = parseVerifiedKey(verifiedKey)
  if (!parsed) return null

  const title = getVerifiedFieldTitle(parsed)
  return {
    question: title,
    fieldType: VERIFIED_FIELD_TYPES[parsed.baseKey],
    answer: value,
    _id: title,
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

/** V4 processing functions */

/**
 * Builds a FormFieldMeta map from form field definitions, keyed by field ID.
 */
export const buildFormFieldMetaMap = (
  formFields: FormFieldDto[],
): Record<string, FormFieldMeta> => {
  const map: Record<string, FormFieldMeta> = {}
  for (const ff of formFields) {
    map[ff._id] = {
      question: ff.title,
      ...('myInfo' in ff && ff.myInfo
        ? { myInfo: { attr: ff.myInfo.attr } }
        : {}),
    }
  }
  return map
}

/**
 * Converts V4 decrypted responses into FormField[] for the shared
 * augmentDecryptedResponses pipeline.
 *
 * NOTE: Verified content (SPCP/sgID) is appended after the form fields, the
 * same way the storage-mode path does it. When a step after Step 1 collected an
 * identity, each identity follows its own step's fields instead.
 */
export const processDecryptedContentV4 = (
  formFields: FormFieldDto[],
  formLogics: LogicDto[],
  responses: FieldResponsesV4,
  verified?: Record<string, string>,
  workflow: StepFieldList[] = [],
): VerifiedFormField[] => {
  const v1Fields = flattenV4ToFormFields({
    v4Responses: responses,
    formFields,
    formLogics,
  }) as unknown as VerifiedFormField[]
  if (!verified) return v1Fields

  const verifiedEntries = Object.keys(verified).flatMap((key) => {
    const field = getVerifiedFieldFromResponse(key, verified[key])
    return field
      ? [{ stepNumber: parseVerifiedKey(key)?.stepNumber, field }]
      : []
  })
  return placeVerifiedFieldsByStep({
    fields: v1Fields,
    verified: verifiedEntries,
    workflow,
  })
}
