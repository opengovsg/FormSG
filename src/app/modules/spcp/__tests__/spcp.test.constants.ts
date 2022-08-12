import { MyInfoMode } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'
import crypto from 'crypto'
import _ from 'lodash'

import { ISpcpMyInfo } from 'src/app/config/features/spcp-myinfo.config'
import { ILoginSchema, IPopulatedForm } from 'src/types'

import { JwtName } from '../spcp.types'

export const MOCK_SERVICE_PARAMS: ISpcpMyInfo = {
  isSPMaintenance: 'isSPMaintenance',
  isCPMaintenance: 'isCPMaintenance',
  myInfoBannerContent: 'myInfoBannerContent',
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
  myInfoClientMode: MyInfoMode.Dev,
  myInfoKeyPath: 'myInfoKeyPath',
  myInfoCertPath: 'myInfoCertPath',
  myInfoClientId: 'myInfoClientId',
  myInfoClientSecret: 'myInfoClientSecret',
  spOidcNdiDiscoveryEndpoint: 'spOidcNdiDiscoveryEndpoint',
  spOidcNdiJwksEndpoint: 'spOidcNdiJwksEndpoint',
  spOidcRpClientId: 'spOidcRpClientId',
  spOidcRpRedirectUrl: 'spOidcRpRedirectUrl',
  spOidcRpJwksPublicPath: 'tests/certs/test_sp_rp_public_jwks.json',
  spOidcRpJwksSecretPath: 'tests/certs/test_sp_rp_secret_jwks.json',
  cpOidcNdiDiscoveryEndpoint: 'cpOidcNdiDiscoveryEndpoint',
  cpOidcNdiJwksEndpoint: 'cpOidcNdiJwksEndpoint',
  cpOidcRpClientId: 'cpOidcRpClientId',
  cpOidcRpRedirectUrl: 'cpOidcRpRedirectUrl',
  cpOidcRpJwksPublicPath: 'tests/certs/test_cp_rp_public_jwks.json',
  cpOidcRpJwksSecretPath: 'tests/certs/test_cp_rp_secret_jwks.json',
}

export const MOCK_ESRVCID = 'eServiceId'
export const MOCK_TARGET = new ObjectId().toHexString()
export const MOCK_DESTINATION = `/${MOCK_TARGET}`
export const MOCK_REDIRECT_URL = 'redirectUrl'
export const MOCK_REMEMBER_ME = true
export const MOCK_RELAY_STATE = `${MOCK_DESTINATION},${MOCK_REMEMBER_ME}`
export const MOCK_LOGIN_HTML = 'html'
export const MOCK_ERROR_CODE = '138'
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

export const MOCK_CP_FORM = {
  authType: 'CP',
  title: 'Mock CP form',
  _id: new ObjectId().toHexString(),
  admin: {
    _id: new ObjectId().toHexString(),
    agency: new ObjectId().toHexString(),
  },
  getPublicView: () => _.omit(this, 'admin'),
} as unknown as IPopulatedForm

export const MOCK_MYINFO_FORM = {
  authType: 'MyInfo',
  title: 'Mock MyInfo form',
  _id: new ObjectId().toHexString(),
  admin: {
    _id: new ObjectId().toHexString(),
    agency: new ObjectId().toHexString(),
  },
} as unknown as IPopulatedForm

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

export const MOCK_ENCODED_QUERY =
  'NjFhOWJiNDhmZmNhMjIwMDRhMzA3OTE1PWJsYWhibGFoMTIzJjYxYTliYjUzZmZjYTIyMDA0YTMwNzkyMT1ibGFoYmxhaDQ1Ng=='
export const MOCK_DECODED_QUERY =
  '?61a9bb48ffca22004a307915=blahblah123&61a9bb53ffca22004a307921=blahblah456'

export const MOCK_SP_OIDC_AUTHORISATION_CODE = 'abcdefg'
export const MOCK_CP_OIDC_AUTHORISATION_CODE = 'defhijk'
export const MOCK_OIDC_STATE = `${MOCK_DESTINATION}-${MOCK_REMEMBER_ME}`
export const MOCK_NRIC = 'S1234567C'
export const MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD = {
  userName: MOCK_NRIC,
}
export const MOCK_UEN = 'A123456789X'
export const MOCK_CP_OIDC_EXTRACTED_NDI_PAYLOAD = {
  userName: MOCK_UEN,
  userInfo: MOCK_NRIC,
}
export const MOCK_SP_OIDC_JWT_PAYLOAD = {
  userName: MOCK_NRIC,
  rememberMe: true,
}
export const MOCK_CP_OIDC_JWT_PAYLOAD = {
  userName: MOCK_UEN,
  userInfo: MOCK_NRIC,
  rememberMe: true,
}

export const SP_OIDC_NDI_DISCOVERY_ENDPOINT = 'spOidcNdiDiscoveryEndpoint'
export const SP_OIDC_NDI_JWKS_ENDPOINT = 'spOidcNdiJwksEndpoint'
export const SP_OIDC_RP_CLIENT_ID = 'spOidcRpClientId'
export const SP_OIDC_RP_REDIRECT_URL = 'spOidcRpRedirectUrl'

export const CP_OIDC_NDI_DISCOVERY_ENDPOINT = 'cpOidcNdiDiscoveryEndpoint'
export const CP_OIDC_NDI_JWKS_ENDPOINT = 'cpOidcNdiJwksEndpoint'
export const CP_OIDC_RP_CLIENT_ID = 'cpOidcRpClientId'
export const CP_OIDC_RP_REDIRECT_URL = 'cpOidcRpRedirectUrl'
