import convict, { Path, Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { IOneVarsSchema } from '../../../types'
import { createLoggerWithLabel } from '../logger'
import { resetToApplicationDefaultForUndefinedSsmValues } from '../schema'

const logger = createLoggerWithLabel(module)

convict.addFormat(url)

export const optionalValuesFromSsm: Path<IOneVarsSchema>[] = []

// RATIONALE: shared between the schema and isOneConfigured() so they can't drift.
const ONE_PLACEHOLDER_DISCOVERY_URL = 'client-id'
const ONE_PLACEHOLDER_CLIENT_SECRET = 'test'

export const oneVarsSchema: Schema<IOneVarsSchema> = {
  discoveryUrl: {
    doc: 'The discovery URL for the one.gov.sg service',
    format: String,
    default: 'https://one.gov.sg/api/auth/.well-known/openid-configuration',
    env: 'ONE_DISCOVERY_URL',
  },
  clientId: {
    doc: 'The client id registered with one.gov.sg',
    format: String,
    default: ONE_PLACEHOLDER_DISCOVERY_URL,
    env: 'ONE_CLIENT_ID',
  },
  clientSecret: {
    doc: 'The client secret for the one.gov.sg service',
    format: String,
    default: ONE_PLACEHOLDER_CLIENT_SECRET,
    env: 'ONE_CLIENT_SECRET',
  },
}

// RATIONALE: every var has a default so missing env doesn't throw at startup;
// isOneConfigured() decides at runtime whether values are usable.
const oneConfig = convict(oneVarsSchema)
resetToApplicationDefaultForUndefinedSsmValues(oneConfig, optionalValuesFromSsm)

export const one = oneConfig.validate({ allowed: 'strict' }).getProperties()

export const isOneConfigured = (config: IOneVarsSchema): boolean => {
  const { discoveryUrl, clientId, clientSecret } = config

  if (
    !discoveryUrl ||
    !clientId ||
    !clientSecret ||
    discoveryUrl === ONE_PLACEHOLDER_DISCOVERY_URL ||
    clientSecret === ONE_PLACEHOLDER_CLIENT_SECRET
  ) {
    logger.warn({
      message:
        'one.gov.sg configuration is incomplete. one.gov.sg login will be disabled. Using default Email OTP authentication.',
      meta: {
        action: 'isOneConfigured',
        hasDiscoveryUrl: !!discoveryUrl,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        isPlaceholderDiscoveryUrl:
          discoveryUrl === ONE_PLACEHOLDER_DISCOVERY_URL,
        isPlaceholderClientSecret:
          clientSecret === ONE_PLACEHOLDER_CLIENT_SECRET,
      },
    })
    return false
  }

  try {
    new URL(discoveryUrl)
  } catch (error) {
    logger.error({
      message:
        'ONE_DISCOVERY_URL is not a valid URL. one.gov.sg login will be disabled. Using default Email OTP authentication.',
      meta: {
        action: 'isOneConfigured',
        discoveryUrl,
        error,
      },
      error,
    })
    return false
  }

  return true
}
