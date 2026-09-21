import { FormFieldDto, LogicDto } from 'formsg-shared/types'
import { flattenV4ToFormFields } from 'formsg-shared/utils/flatten-v4-to-v1'
import { FieldResponsesV4Input } from 'formsg-shared/utils/v4-answer'
import { err, ok, Result } from 'neverthrow'

import formsgSdk from '../../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../../config/logger'

import { V1ContentProductionError } from './submission-snapshot.errors'

const logger = createLoggerWithLabel(module)

export const buildV1EncryptedContent = ({
  v4Responses,
  formFields,
  formLogics,
  formPublicKey,
  logMeta,
}: {
  v4Responses: FieldResponsesV4Input
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
  formPublicKey: string
  logMeta: Record<string, unknown>
}): Result<string, V1ContentProductionError> => {
  try {
    const v1Fields = flattenV4ToFormFields({
      v4Responses,
      formFields,
      formLogics,
    })

    return ok(formsgSdk.crypto.encrypt(v1Fields, formPublicKey))
  } catch (error) {
    logger.error({
      message: 'Failed to produce the V1 copy of a multirespondent submission',
      meta: { action: 'buildV1EncryptedContent', ...logMeta },
      error: error as Error,
    })
    return err(new V1ContentProductionError(undefined, error))
  }
}
