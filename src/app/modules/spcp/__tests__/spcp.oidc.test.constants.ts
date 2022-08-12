// Some constants are placed separately in this file because spcp.service.spec mocks the fs readFileSync function resulting in an error
// TODO(#4496): Merge the constants in this file with spcp.test.constants

import fs from 'fs'

import {
  PublicJwks,
  SecretJwks,
  SpcpOidcClientConstructorParams,
} from '../spcp.oidc.client.types'

import {
  CP_OIDC_NDI_DISCOVERY_ENDPOINT,
  CP_OIDC_NDI_JWKS_ENDPOINT,
  CP_OIDC_RP_CLIENT_ID,
  CP_OIDC_RP_REDIRECT_URL,
  SP_OIDC_NDI_DISCOVERY_ENDPOINT,
  SP_OIDC_NDI_JWKS_ENDPOINT,
  SP_OIDC_RP_CLIENT_ID,
  SP_OIDC_RP_REDIRECT_URL,
} from './spcp.test.constants'

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
