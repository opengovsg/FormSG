import convict, { Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { IGovLoginVarsSchema } from '../../../types'

convict.addFormat(url)

export const govloginVarsSchema: Schema<IGovLoginVarsSchema> = {
  clientId: {
    doc: 'The client id registered with GovLogin',
    format: String,
    default: null,
    env: 'GOVLOGIN_CLIENT_ID',
  },
  clientSecret: {
    doc: 'The client secret registered with GovLogin',
    format: String,
    default: null,
    env: 'GOVLOGIN_CLIENT_SECRET',
  },

  redirectUri: {
    doc: 'The callback uri that GovLogin will pass the authorization code and state to',
    format: 'url',
    default: null,
    env: 'GOVLOGIN_REDIRECT_URI',
  },
  hostname: {
    doc: 'The GovLogin authorization hostname.',
    format: String,
    default: 'https://gov-login-stg.beta.gov.sg',
    env: 'GOVLOGIN_HOSTNAME',
  },
}

// Load and validate govlogin configuration values
// If environment variables are not present, an error will be thrown
export const govlogin = convict(govloginVarsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
