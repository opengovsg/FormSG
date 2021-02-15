import { Mode as MyInfoClientMode } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'
import crypto from 'crypto'

import { ISpcpMyInfo } from 'src/config/feature-manager'
import { ILoginSchema, IPopulatedForm } from 'src/types'

import { JwtName } from '../spcp.types'

export const MOCK_SERVICE_PARAMS: ISpcpMyInfo = {
  isSPMaintenance: 'isSPMaintenance',
  isCPMaintenance: 'isCPMaintenance',
  spCookieMaxAge: 1,
  spCookieMaxAgePreserved: 2,
  spcpCookieDomain: 'spcpCookieDomain',
  cpCookieMaxAge: 3,
  // spIdpId and cpIdpId need to match the injected environment values
  // in order for query parameter validation on the /singpass/login
  // and /corppass/login routes to pass
  spIdpId: String(process.env.SINGPASS_IDP_ID),
  cpIdpId: String(process.env.CORPPASS_IDP_ID),
  spPartnerEntityId: 'spPartnerEntityId',
  cpPartnerEntityId: 'cpPartnerEntityId',
  spIdpLoginUrl: 'spIdpLoginUrl',
  cpIdpLoginUrl: 'cpIdpLoginUrl',
  spIdpEndpoint: 'spIdpEndpoint',
  cpIdpEndpoint: 'cpIdpEndpoint',
  spEsrvcId: 'spEsrvcId',
  cpEsrvcId: 'cpEsrvcId',
  spFormSgKeyPath: 'spFormSgKeyPath',
  cpFormSgKeyPath: 'cpFormSgKeyPath',
  spFormSgCertPath: 'spFormSgCertPath',
  cpFormSgCertPath: 'cpFormSgCertPath',
  spIdpCertPath: 'spIdpCertPath',
  cpIdpCertPath: 'cpIdpCertPath',
  myInfoClientMode: MyInfoClientMode.Dev,
  myInfoKeyPath: 'myInfoKeyPath',
}

export const MOCK_ESRVCID = 'eServiceId'
export const MOCK_TARGET = new ObjectId().toHexString()
export const MOCK_DESTINATION = `/${MOCK_TARGET}`
export const MOCK_REDIRECT_URL = 'redirectUrl'
export const MOCK_REMEMBER_ME = true
export const MOCK_RELAY_STATE = `${MOCK_DESTINATION},${MOCK_REMEMBER_ME}`
export const MOCK_LOGIN_HTML = 'html'
export const MOCK_ERROR_CODE = 'errorCode'
export const MOCK_TITLE = 'title'
export const MOCK_JWT = 'jwt'

export const MOCK_SP_JWT_PAYLOAD = { userName: 'mockUserName' }
export const MOCK_CP_JWT_PAYLOAD = {
  userName: 'mockUserName',
  userInfo: 'mockUserInfo',
}
const spPartnerHash = crypto
  .createHash('sha1')
  .update(MOCK_SERVICE_PARAMS.spIdpId, 'utf8')
  .digest('hex')
const cpPartnerHash = crypto
  .createHash('sha1')
  .update(MOCK_SERVICE_PARAMS.cpIdpId, 'utf8')
  .digest('hex')
const spSamlHex = `0004${'a'.repeat(4)}${spPartnerHash}${'a'.repeat(40)}`
const cpSamlHex = `0004${'a'.repeat(4)}${cpPartnerHash}${'a'.repeat(40)}`
export const MOCK_SP_SAML = Buffer.from(spSamlHex, 'hex').toString('base64')
export const MOCK_CP_SAML = Buffer.from(cpSamlHex, 'hex').toString('base64')
// Set typecode to 5 instead of 4
export const MOCK_SP_SAML_WRONG_TYPECODE = Buffer.from(
  `0005${'a'.repeat(4)}${spPartnerHash}${'a'.repeat(40)}`,
  'hex',
).toString('base64')
export const MOCK_CP_SAML_WRONG_TYPECODE = Buffer.from(
  `0005${'a'.repeat(4)}${cpPartnerHash}${'a'.repeat(40)}`,
  'hex',
).toString('base64')
// Set hash to nonsense
export const MOCK_SP_SAML_WRONG_HASH = Buffer.from(
  `0004${'a'.repeat(84)}`,
  'hex',
).toString('base64')
export const MOCK_CP_SAML_WRONG_HASH = Buffer.from(
  `0004${'a'.repeat(84)}`,
  'hex',
).toString('base64')

export const MOCK_ATTRIBUTES = {
  UserName: 'username',
  UserInfo: {
    CPEntID: 'CPEntID',
    CPUID: 'CPUID',
  },
}

export const MOCK_GET_ATTRIBUTES_RETURN_VALUE = {
  relayState: 'relayState',
  attributes: MOCK_ATTRIBUTES,
}

export const MOCK_JWT_PAYLOAD = {
  userName: 'userName',
  userInfo: 'userInfo',
  rememberMe: true,
}

export const MOCK_SP_FORM = ({
  authType: 'SP',
  title: 'Mock SP form',
  _id: new ObjectId().toHexString(),
  admin: {
    _id: new ObjectId().toHexString(),
    agency: new ObjectId().toHexString(),
  },
} as unknown) as IPopulatedForm

export const MOCK_CP_FORM = ({
  authType: 'CP',
  title: 'Mock CP form',
  _id: new ObjectId().toHexString(),
  admin: {
    _id: new ObjectId().toHexString(),
    agency: new ObjectId().toHexString(),
  },
} as unknown) as IPopulatedForm

export const MOCK_LOGIN_DOC = {
  _id: new ObjectId().toHexString(),
  admin: new ObjectId().toHexString(),
  agency: new ObjectId().toHexString(),
  form: new ObjectId().toHexString(),
  esrvcId: MOCK_ESRVCID,
} as ILoginSchema

export const MOCK_COOKIE_SETTINGS = {
  domain: 'domain',
  path: 'path',
}

export const MOCK_COOKIES = {
  [JwtName.SP]: 'mockSpJwt',
  [JwtName.CP]: 'mockCpJwt',
}
