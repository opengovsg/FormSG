import convict, { Path, Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { ISsoVarsSchema } from '../../../types'
import { resetToApplicationDefaultForUndefinedSsmValues } from '../schema'

convict.addFormat(url)

const HOUR_IN_MILLIS = 1000 * 60 * 60
const DAY_IN_MILLIS = 24 * HOUR_IN_MILLIS

export const optionalValuesFromSsm: Path<ISsoVarsSchema>[] = ['hostname']

export const ssoVarsSchema: Schema<ISsoVarsSchema> = {
  discoveryUrl: {
    doc: 'The discovery URL for the SSO service',
    format: String,
    default: 'http://localhost:5354/api/oidc/.well-known/openid-configuration',
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
