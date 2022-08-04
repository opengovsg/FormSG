import { err, ok, Result } from 'neverthrow'

import { FormAuthType } from '../../../../shared/types'
import { webhooksAndVerifiedContentConfig } from '../../config/features/webhook-verified-content.config'
import formsgSdk from '../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../config/logger'

import { EncryptVerifiedContentError } from './verified-content.errors'
import {
  CpVerifiedContent,
  EncryptVerificationContentParams,
  GetVerifiedContentParams,
  SgidVerifiedContent,
  SpVerifiedContent,
  VerifiedContentResult,
} from './verified-content.types'
import {
  getCpVerifiedContent,
  getSgidVerifiedContent,
  getSpVerifiedContent,
} from './verified-content.utils'

const logger = createLoggerWithLabel(module)

/**
 * Extracts and returns verified content from given type and data.
 * @returns ok(CpVerifiedContent | SpVerifiedContent) if extracted content is valid and confirms to expected shape.
 * @returns err(MalformedVerifiedContentError) if extracted shape mismatches.
 */
export const getVerifiedContent = ({
  type,
  data,
}: GetVerifiedContentParams): VerifiedContentResult<
  CpVerifiedContent | SpVerifiedContent | SgidVerifiedContent
> => {
  switch (type) {
    case FormAuthType.SP:
      return getSpVerifiedContent(data)
    case FormAuthType.CP:
      return getCpVerifiedContent(data)
    case FormAuthType.SGID:
      return getSgidVerifiedContent(data)
  }
}

export const encryptVerifiedContent = ({
  verifiedContent,
  formPublicKey,
}: EncryptVerificationContentParams): Result<
  string,
  EncryptVerifiedContentError
> => {
  try {
    const encryptedContent = formsgSdk.crypto.encrypt(
      verifiedContent,
      formPublicKey,
      webhooksAndVerifiedContentConfig.signingSecretKey,
    )
    return ok(encryptedContent)
  } catch (error) {
    logger.error({
      message: 'Unable to encrypt verified content',
      meta: {
        action: 'encryptVerifiedContent',
      },
      error,
    })

    return err(new EncryptVerifiedContentError())
  }
}
