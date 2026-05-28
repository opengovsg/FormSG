import convict, { Path, Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { ISsoVarsSchema } from '../../../types'
import { createLoggerWithLabel } from '../logger'
import { resetToApplicationDefaultForUndefinedSsmValues } from '../schema'

const logger = createLoggerWithLabel(module)

convict.addFormat(url)

export const optionalValuesFromSsm: Path<ISsoVarsSchema>[] = [] //['hostname']

// RATIONALE: shared between the schema and isSsoConfigured() so they can't drift.
const SSO_PLACEHOLDER_CLIENT_ID = 'client-id'
const SSO_PLACEHOLDER_CLIENT_SECRET = 'test'

export const ssoVarsSchema: Schema<ISsoVarsSchema> = {
  discoveryUrl: {
    doc: 'The discovery URL for the SSO service',
    format: String,
    default:
      'https://sso.open.gov.sg/api/oidc/.well-known/openid-configuration',
    env: 'SSO_DISCOVERY_URL',
  },
  clientId: {
    doc: 'The client id registered with SSO',
    format: String,
    default: SSO_PLACEHOLDER_CLIENT_ID,
    env: 'SSO_CLIENT_ID',
  },
  clientSecret: {
    doc: 'The client secret for the SSO service',
    format: String,
    default: SSO_PLACEHOLDER_CLIENT_SECRET,
    env: 'SSO_CLIENT_SECRET',
  },
}

// RATIONALE: every var has a default so missing env doesn't throw at startup;
// isSsoConfigured() decides at runtime whether values are usable.
const ssoConfig = convict(ssoVarsSchema)
resetToApplicationDefaultForUndefinedSsmValues(ssoConfig, optionalValuesFromSsm)

export const sso = ssoConfig.validate({ allowed: 'strict' }).getProperties()

export const isSsoConfigured = (config: ISsoVarsSchema): boolean => {
  const { discoveryUrl, clientId, clientSecret } = config

  if (
    !discoveryUrl ||
    !clientId ||
    !clientSecret ||
    clientId === SSO_PLACEHOLDER_CLIENT_ID ||
    clientSecret === SSO_PLACEHOLDER_CLIENT_SECRET
  ) {
    logger.warn({
      message:
        'SSO configuration is incomplete. SSO login will be disabled. Using default Email OTP authentication.',
      meta: {
        action: 'isSsoConfigured',
        hasDiscoveryUrl: !!discoveryUrl,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        isDefaultClientId: clientId === SSO_PLACEHOLDER_CLIENT_ID,
        isDefaultClientSecret: clientSecret === SSO_PLACEHOLDER_CLIENT_SECRET,
      },
    })
    return false
  }

  try {
    new URL(discoveryUrl)
  } catch (error) {
    logger.error({
      message:
        'SSO_DISCOVERY_URL is not a valid URL. SSO login will be disabled. Using default Email OTP authentication.',
      meta: {
        action: 'isSsoConfigured',
        discoveryUrl,
        error,
      },
      error,
    })
    return false
  }

  return true
}
