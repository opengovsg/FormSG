import convict, { Path, Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { ISgidVarsSchema } from '../../../types'
import {
  validateIacStringParam,
  validateNonIacStringParam,
} from '../../utils/iac'
import { resetToApplicationDefaultForUndefinedSsmValues } from '../schema'

convict.addFormat(url)

export const optionalValuesFromSsm: Path<ISgidVarsSchema>[] = ['hostname']

export const sgidVarsSchema: Schema<ISgidVarsSchema> = {
  clientId: {
    doc: 'The client id registered with sgID',
    format: String,
    default: null,
    env: 'SGID_CLIENT_ID',
  },
  clientSecret: {
    doc: 'The client secret registered with sgID',
    format: String,
    default: null,
    env: 'SGID_CLIENT_SECRET',
  },
  privateKey: {
    doc: 'The private key to decrypt payloads from sgID.',
    format: validateIacStringParam,
    default: null,
    env: 'SGID_PRIVATE_KEY',
  },
  privateKeyPath: {
    doc: 'The path to the private key to decrypt payloads from sgID.',
    format: validateNonIacStringParam,
    default: null,
    env: 'SGID_PRIVATE_KEY_PATH',
  },
  adminLoginRedirectUri: {
    doc: 'The callback uri that sgID will pass the authorization code and state to for admin application logins',
    format: 'url',
    default: null,
    env: 'SGID_ADMIN_LOGIN_REDIRECT_URI',
  },
  hostname: {
    doc: 'The sgID authorization hostname.',
    format: String,
    default: '',
    env: 'SGID_HOSTNAME',
  },
}

// Load and validate sgid configuration values
// If environment variables are not present, an error will be thrown
const sgidConfig = convict(sgidVarsSchema)
resetToApplicationDefaultForUndefinedSsmValues(
  sgidConfig,
  optionalValuesFromSsm,
)

export const sgid = sgidConfig.validate({ allowed: 'strict' }).getProperties()
