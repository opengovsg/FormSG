import { FormFieldDto, LogicDto } from 'formsg-shared/types'
import { flattenV4ToFormFields } from 'formsg-shared/utils/flatten-v4-to-v1'
import { applyMyInfoPrefix } from 'formsg-shared/utils/myinfo-prefix'
import { FieldResponsesV4Input } from 'formsg-shared/utils/v4-answer'
import { err, ok, Result } from 'neverthrow'

import formsgSdk from '../../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../../config/logger'
import { encryptVerifiedContent } from '../../../verified-content/verified-content.service'

import { V1ContentMappingError } from './submission-snapshot.errors'

const logger = createLoggerWithLabel(module)

export const buildV1VerifiedContent = ({
  verifiedContent,
  formPublicKey,
}: {
  verifiedContent?: Record<string, string>
  formPublicKey: string
}): Result<string | undefined, V1ContentMappingError> => {
  if (!verifiedContent || Object.keys(verifiedContent).length === 0) {
    return ok(undefined)
  }

  // V1 eligibility guarantees a single step. Keep the same flat keys and
  // signing/encryption path as storage mode, including sgID's unsuffixed key.
  const flatContent = Object.fromEntries(
    Object.entries(verifiedContent).map(([key, value]) => [
      key.replace(/ \(Step 1\)$/, ''),
      value,
    ]),
  )
  return encryptVerifiedContent({
    verifiedContent: flatContent,
    formPublicKey,
  }).mapErr((error) => new V1ContentMappingError(undefined, error))
}

export const buildV1EncryptedContent = ({
  v4Responses,
  formFields,
  formLogics,
  formPublicKey,
  myInfoReadOnlyFieldIds,
  logMeta,
}: {
  v4Responses: FieldResponsesV4Input
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
  formPublicKey: string
  myInfoReadOnlyFieldIds: readonly string[]
  logMeta: Record<string, unknown>
}): Result<string, V1ContentMappingError> => {
  try {
    const v1Fields = applyMyInfoPrefix(
      flattenV4ToFormFields({ v4Responses, formFields, formLogics }),
      myInfoReadOnlyFieldIds,
    )

    return ok(formsgSdk.crypto.encrypt(v1Fields, formPublicKey))
  } catch (error) {
    logger.error({
      message: 'Failed to produce the V1 copy of a multirespondent submission',
      meta: { action: 'buildV1EncryptedContent', ...logMeta },
      error: error as Error,
    })
    return err(new V1ContentMappingError(undefined, error))
  }
}
