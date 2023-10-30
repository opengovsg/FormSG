import { ObjectId } from 'bson'
import _ from 'lodash'

import { IPopulatedForm } from 'src/types'

import { MOCK_COOKIE_AGE } from '../../myinfo/__tests__/myinfo.test.constants'
import { SGID_MYINFO_NRIC_NUMBER_SCOPE } from '../sgid.constants'

export const MOCK_TARGET = new ObjectId().toHexString()
export const MOCK_DESTINATION = `/${MOCK_TARGET}`
export const MOCK_REDIRECT_URL = 'redirectUrl'
export const MOCK_REMEMBER_ME = true
export const MOCK_STATE = `${MOCK_DESTINATION},${MOCK_REMEMBER_ME}`
export const MOCK_TITLE = 'title'
export const MOCK_JWT = 'jwt'

export const MOCK_MAX_AGE = 4 * 60 * 60

export const MOCK_AUTH_CODE = 'mock-authorization-code'

export const MOCK_ACCESS_TOKEN = 'mock-access-token'

export const MOCK_SUBJECT = 'mock-subject-proxy-id'

export const MOCK_CODE_VERIFIER = 'mock_code_verifier'

export const MOCK_CODE_CHALLENGE = 'mock_code_challenge'

export const MOCK_TOKEN_RESULT = {
  sub: MOCK_SUBJECT,
  accessToken: MOCK_ACCESS_TOKEN,
}

export const MOCK_USER_INFO = {
  sub: MOCK_SUBJECT,
  data: { 'myinfo.nric_number': 'S9322889A' },
}

export const MOCK_JWT_PAYLOAD = {
  userName: MOCK_USER_INFO.data[SGID_MYINFO_NRIC_NUMBER_SCOPE],
}

export const MOCK_SGID_FORM = {
  authType: 'SGID',
  title: 'Mock SGID form',
  _id: new ObjectId().toHexString(),
  admin: {
    _id: new ObjectId().toHexString(),
    agency: new ObjectId().toHexString(),
  },
  getPublicView: () => _.omit(this, 'admin'),
} as unknown as IPopulatedForm

export const MOCK_SP_FORM = {
  authType: 'SP',
  title: 'Mock SP form',
  _id: new ObjectId().toHexString(),
  admin: {
    _id: new ObjectId().toHexString(),
    agency: new ObjectId().toHexString(),
  },
  getPublicView: () => _.omit(this, 'admin'),
} as unknown as IPopulatedForm

export const MOCK_COOKIE_SETTINGS = {
  domain: 'domain',
  path: 'path',
}

export const MOCK_NONCE = 'nonce'

export const MOCK_OPTIONS = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  privateKeyPath: 'private-key',
  publicKeyPath: 'public-key',
  hostname: 'http://localhost:5156/',
  formLoginRedirectUri: MOCK_REDIRECT_URL,
  adminLoginRedirectUri: MOCK_REDIRECT_URL,
  cookieDomain: MOCK_COOKIE_SETTINGS.domain,
  cookieMaxAge: MOCK_COOKIE_AGE,
  cookieMaxAgePreserved: MOCK_COOKIE_AGE * 2,
  jwtSecret: 'jwt-secret',
}

export const MOCK_JWT_ALGORITHM = 'HS256'
