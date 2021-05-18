import { Schema } from 'convict'

import { ISgidVarsSchema } from '../../types'

const HOUR_IN_MILLIS = 1000 * 60 * 60
const DAY_IN_MILLIS = 24 * HOUR_IN_MILLIS

export const sgidVarsSchema: Schema<ISgidVarsSchema> = {
  endpoint: {
    doc: 'The sgID OIDC endpoint',
    format: '*',
    default: '',
    env: 'SGID_ENDPOINT',
  },
  clientId: {
    doc: 'The client id registered with sgID',
    format: '*',
    default: '',
    env: 'SGID_CLIENT_ID',
  },
  clientSecret: {
    doc: 'The client secret registered with sgID',
    format: '*',
    default: '',
    env: 'SGID_CLIENT_SECRET',
  },
  privateKey: {
    doc: 'The path to the private key to decrypt payloads from sgID. Also used for JWT signing',
    format: '*',
    default: '',
    env: 'SGID_PRIVATE_KEY',
  },
  publicKey: {
    doc: 'The path to the public key given to sgID. Also used to verify JWTs created by FormSG',
    format: '*',
    default: '',
    env: 'SGID_PUBLIC_KEY',
  },
  redirectUri: {
    doc: 'The callback uri that sgID will pass the authorization code and state to',
    format: '*',
    default: '',
    env: 'SGID_REDIRECT_URI',
  },
  cookieMaxAge: {
    doc: 'Max sgID cookie age with remember me unchecked',
    format: 'int',
    default: 3 * HOUR_IN_MILLIS,
    env: 'SGID_COOKIE_MAX_AGE',
  },
  cookieMaxAgePreserved: {
    doc: 'Max sgID cookie age with remember me checked',
    format: 'int',
    default: 30 * DAY_IN_MILLIS,
    env: 'SGID_COOKIE_MAX_AGE_PRESERVED',
  },
  cookieDomain: {
    doc: 'Domain name set on cookie that holds the sgID jwt',
    format: String,
    default: '',
    env: 'SGID_COOKIE_DOMAIN',
  },
}
