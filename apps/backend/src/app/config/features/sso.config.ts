import convict, { Path, Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { ISsoVarsSchema } from '../../../types'
import { createLoggerWithLabel } from '../logger'
import { resetToApplicationDefaultForUndefinedSsmValues } from '../schema'

const logger = createLoggerWithLabel(module)

convict.addFormat(url)

export const optionalValuesFromSsm: Path<ISsoVarsSchema>[] = [] //['hostname']

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
    default: 'client-id',
    env: 'SSO_CLIENT_ID',
  },
  clientSecret: {
    doc: 'The client secret for the SSO service',
    format: String,
    default: 'test',
    env: 'SSO_CLIENT_SECRET',
  },
}

// Load and validate sgid configuration values
// If environment variables are not present, an error will be thrown
const ssoConfig = convict(ssoVarsSchema)
resetToApplicationDefaultForUndefinedSsmValues(ssoConfig, optionalValuesFromSsm)

export const sso = ssoConfig.validate({ allowed: 'strict' }).getProperties()

/**
 * Validates if the SSO configuration is properly set up.
 * Checks if the discovery URL is valid and environment variables are not default/placeholder values.
 */
export const isSsoConfigured = (): boolean => {
  const { discoveryUrl, clientId, clientSecret } = sso

  // Check if environment variables are blank or default values
  if (
    !discoveryUrl ||
    !clientId ||
    !clientSecret ||
    clientId === 'client-id' ||
    clientSecret === 'test'
  ) {
    logger.warn({
      message:
        'SSO configuration is incomplete. SSO login will be disabled. Using default Email OTP authentication.',
      meta: {
        action: 'isSsoConfigured',
        hasDiscoveryUrl: !!discoveryUrl,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        isDefaultClientId: clientId === 'client-id',
        isDefaultClientSecret: clientSecret === 'test',
      },
    })
    return false
  }

  // Validate that discoveryUrl is a valid URL
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
