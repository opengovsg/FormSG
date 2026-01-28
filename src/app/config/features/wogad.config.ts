import convict, { Path, Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { IWogadVarsSchema } from '../../../types'
import { resetToApplicationDefaultForUndefinedSsmValues } from '../schema'

convict.addFormat(url)

const optionalValuesFromSsm: Path<IWogadVarsSchema>[] = [
  'authority',
  'redirectUri',
]

export const wogadVarsSchema: Schema<IWogadVarsSchema> = {
  authority: {
    doc: 'The authority URL for the WOG AD service',
    format: String,
    default: 'https://login.microsoftonline.com/common',
    env: 'WOGAD_AUTHORITY',
  },
  clientId: {
    doc: 'The client id for the application registered with WOG AD',
    format: String,
    default: '',
    env: 'WOGAD_CLIENT_ID',
  },
  clientSecret: {
    doc: 'The client secret for the WOG AD service',
    format: String,
    default: '',
    env: 'WOGAD_CLIENT_SECRET',
  },
  redirectUri: {
    doc: 'The path to the redirect URI after the auth code is received. It should start with /',
    format: String,
    default: '/login/wogad',
    env: 'WOGAD_REDIRECT_URI',
  },
}

// Load and validate wogad configuration values
// If environment variables are not present, an error will be thrown
const wogadConfig = convict(wogadVarsSchema)
resetToApplicationDefaultForUndefinedSsmValues(
  wogadConfig,
  optionalValuesFromSsm,
)

export const wogad = wogadConfig.validate({ allowed: 'strict' }).getProperties()
