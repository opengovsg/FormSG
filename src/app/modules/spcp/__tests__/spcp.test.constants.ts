import { MyInfoMode } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'
import fs from 'fs'
import _ from 'lodash'

import { ISpcpMyInfo } from 'src/app/config/features/spcp-myinfo.config'
import { ILoginSchema, IPopulatedForm } from 'src/types'

import {
  PublicJwks,
  SecretJwks,
  SpcpOidcClientConstructorParams,
} from '../spcp.oidc.client.types'
import { JwtName } from '../spcp.types'

export const MOCK_SERVICE_PARAMS: ISpcpMyInfo = {
  isSPMaintenance: 'isSPMaintenance',
  isCPMaintenance: 'isCPMaintenance',
  myInfoBannerContent: 'myInfoBannerContent',
  spCookieMaxAge: 1,
  spCookieMaxAgePreserved: 2,
  spcpCookieDomain: 'spcpCookieDomain',
  cpCookieMaxAge: 3,
  spEsrvcId: 'spEsrvcId', // Needed for MyInfo
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

export const TEST_SP_RP_PUBLIC_JWKS: PublicJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_sp_rp_public_jwks.json').toString(),
)
export const TEST_SP_RP_SECRET_JWKS: SecretJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_sp_rp_secret_jwks.json').toString(),
)

export const TEST_CP_RP_PUBLIC_JWKS: PublicJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_cp_rp_public_jwks.json').toString(),
)
export const TEST_CP_RP_SECRET_JWKS: SecretJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_cp_rp_secret_jwks.json').toString(),
)

export const TEST_NDI_SECRET_JWKS: PublicJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_ndi_secret_jwks.json').toString(),
)

export const TEST_NDI_PUBLIC_JWKS: PublicJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_ndi_public_jwks.json').toString(),
)

export const spOidcClientConfig: SpcpOidcClientConstructorParams = {
  ndiDiscoveryEndpoint: SP_OIDC_NDI_DISCOVERY_ENDPOINT,
  ndiJwksEndpoint: SP_OIDC_NDI_JWKS_ENDPOINT,
  rpClientId: SP_OIDC_RP_CLIENT_ID,
  rpRedirectUrl: SP_OIDC_RP_REDIRECT_URL,
  rpSecretJwks: TEST_SP_RP_SECRET_JWKS,
  rpPublicJwks: TEST_SP_RP_PUBLIC_JWKS,
}

export const cpOidcClientConfig: SpcpOidcClientConstructorParams = {
  ndiDiscoveryEndpoint: CP_OIDC_NDI_DISCOVERY_ENDPOINT,
  ndiJwksEndpoint: CP_OIDC_NDI_JWKS_ENDPOINT,
  rpClientId: CP_OIDC_RP_CLIENT_ID,
  rpRedirectUrl: CP_OIDC_RP_REDIRECT_URL,
  rpSecretJwks: TEST_CP_RP_SECRET_JWKS,
  rpPublicJwks: TEST_CP_RP_PUBLIC_JWKS,
}
