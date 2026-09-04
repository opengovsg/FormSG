import convict, { Path, Schema } from 'convict'
import { url } from 'convict-format-with-validator'

import { IOneVarsSchema } from '../../../types'
import { createLoggerWithLabel } from '../logger'
import { resetToApplicationDefaultForUndefinedSsmValues } from '../schema'

const logger = createLoggerWithLabel(module)

convict.addFormat(url)

export const optionalValuesFromSsm: Path<IOneVarsSchema>[] = []

// RATIONALE: shared between the schema and isOneConfigured() so they can't drift.
const ONE_PLACEHOLDER_CLIENT_ID = 'client-id'
// RATIONALE: placeholder has no keys, so isOneConfigured() below always
// rejects it — a real JWKS secret must contain exactly one private signing key.
const ONE_PLACEHOLDER_CLIENT_JWKS_SECRET = '{"keys":[]}'

export const oneVarsSchema: Schema<IOneVarsSchema> = {
  discoveryUrl: {
    doc: 'The discovery URL for the one.gov.sg service',
    format: String,
    default: 'https://one.gov.sg/api/auth/.well-known/openid-configuration',
    env: 'ONE_DISCOVERY_URL',
  },
  clientId: {
    doc: 'The client id registered with one.gov.sg',
    format: String,
    default: ONE_PLACEHOLDER_CLIENT_ID,
    env: 'ONE_CLIENT_ID',
  },
  clientJwksSecret: {
    doc: 'JSON string of a JWK Set containing exactly one private signing key (EC, RSA or OKP), used to authenticate with one.gov.sg via private_key_jwt.',
    format: String,
    default: ONE_PLACEHOLDER_CLIENT_JWKS_SECRET,
    env: 'ONE_OIDC_RP_JWKS_SECRET',
  },
}

// RATIONALE: every var has a default so missing env doesn't throw at startup;
// isOneConfigured() decides at runtime whether values are usable.
const oneConfig = convict(oneVarsSchema)
resetToApplicationDefaultForUndefinedSsmValues(oneConfig, optionalValuesFromSsm)

export const one = oneConfig.validate({ allowed: 'strict' }).getProperties()

// RATIONALE: only checks shape (one private signing key present) — actual
// key material (kty/alg support) is validated where it's imported into a
// CryptoKey, in auth-one.service.ts.
const hasSinglePrivateSigningKey = (clientJwksSecret: string): boolean => {
  try {
    const parsed = JSON.parse(clientJwksSecret)
    return (
      Array.isArray(parsed?.keys) &&
      parsed.keys.length === 1 &&
      typeof parsed.keys[0]?.d === 'string'
    )
  } catch {
    return false
  }
}

export const isOneConfigured = (config: IOneVarsSchema): boolean => {
  const { discoveryUrl, clientId, clientJwksSecret } = config
  const hasJwksSecret = hasSinglePrivateSigningKey(clientJwksSecret)

  if (
    !discoveryUrl ||
    !clientId ||
    !hasJwksSecret ||
    clientId === ONE_PLACEHOLDER_CLIENT_ID
  ) {
    logger.warn({
      message:
        'one.gov.sg configuration is incomplete. one.gov.sg login will be disabled. Using default Email OTP authentication.',
      meta: {
        action: 'isOneConfigured',
        hasDiscoveryUrl: !!discoveryUrl,
        hasClientId: !!clientId,
        hasJwksSecret,
        isPlaceholderClientId: clientId === ONE_PLACEHOLDER_CLIENT_ID,
      },
    })
    return false
  }

  try {
    new URL(discoveryUrl)
  } catch (error) {
    logger.error({
      message:
        'ONE_DISCOVERY_URL is not a valid URL. one.gov.sg login will be disabled. Using default Email OTP authentication.',
      meta: {
        action: 'isOneConfigured',
        discoveryUrl,
        error,
      },
      error,
    })
    return false
  }

  return true
}
