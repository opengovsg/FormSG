import { adaptV4ToV1, FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { FormFieldDto } from 'formsg-shared/types'

import { transformInputsToOutputs } from '~features/public-form/utils/inputTransformation'

/**
 * Flattens V4 responses into FormField[] for consumption by the existing
 * CSV pipeline (CsvRecord, EncryptedResponseCsvGenerator, Response classes).
 *
 * Per-field mapping is delegated to the SDK's adaptV4ToV1 — the canonical
 * V4→V1 adaptation. This wrapper keeps the form-definition concerns:
 * - ordering output to match the form definition (consistent with the V3
 *   processDecryptedContentV3 path),
 * - synthesizing empty entries for unanswered fields, and
 * - appending entries not in the form definition (verified fields) at the end.
 */
export const flattenV4ToFormFields = ({
  v4Responses,
  formFields,
}: {
  v4Responses: FieldResponsesV4
  formFields: FormFieldDto[]
}): FormField[] => {
  const adaptedById = new Map(
    adaptV4ToV1(v4Responses).map((field) => [field._id, field]),
  )
  const formFieldIdSet = new Set(formFields.map((ff) => ff._id))

  // Fields in form definition order, including unanswered ones
  const v1Fields: FormField[] = []

  for (const ff of formFields) {
    const adapted = adaptedById.get(ff._id)
    if (adapted) {
      v1Fields.push(adapted)
      continue
    }
    // Reuse v3 transform to get the correct empty output shape per field type.
    // This returns null for Statement/Image (excluded, matching v3 behavior)
    // and the correct answerArray shape for compound fields like Address, Table, etc.
    const emptyOutput = transformInputsToOutputs(ff)
    if (emptyOutput) {
      v1Fields.push(emptyOutput as unknown as FormField)
    }
  }

  // Append any extra entries (e.g. verified SPCP/sgID fields) not in formFields
  for (const [fieldId, adapted] of adaptedById) {
    if (formFieldIdSet.has(fieldId)) continue
    v1Fields.push(adapted)
  }

  return v1Fields
}
