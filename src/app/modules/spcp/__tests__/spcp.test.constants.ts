import { Mode as MyInfoClientMode } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'
import crypto from 'crypto'

import { ISpcpMyInfo } from 'src/config/feature-manager'

export const MOCK_SERVICE_PARAMS: ISpcpMyInfo = {
  isSPMaintenance: 'isSPMaintenance',
  isCPMaintenance: 'isCPMaintenance',
  spCookieMaxAge: 1,
  spCookieMaxAgePreserved: 2,
  spcpCookieDomain: 'spcpCookieDomain',
  cpCookieMaxAge: 3,
  spIdpId: 'spIdpId',
  cpIdpId: 'cpIdpId',
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
export const MOCK_LOGIN_HTML = 'html'
export const MOCK_ERROR_CODE = 'errorCode'
export const MOCK_TITLE = 'title'
export const MOCK_JWT = 'jwt'
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

export const MOCK_GET_ATTRIBUTES_RETURN_VALUE = {
  relayState: 'relayState',
  attributes: { key: 'value' },
}
export const MOCK_JWT_PAYLOAD = {
  userName: 'userName',
  userInfo: 'userInfo',
  rememberMe: true,
}
