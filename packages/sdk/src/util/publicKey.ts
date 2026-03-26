import { SIGNING_KEYS } from '../resource/signing-keys'
import { VERIFICATION_KEYS } from '../resource/verification-keys'
import { PackageMode } from '../types'

import STAGE from './stage'

/**
 * Retrieves the appropriate signing public key.
 * Defaults to production.
 * @param mode The package mode to retrieve the public key for.
 */
function getSigningPublicKey(mode?: PackageMode) {
  switch (mode) {
    case STAGE.development:
      return SIGNING_KEYS.development.publicKey
    case STAGE.staging:
      return SIGNING_KEYS.staging.publicKey
    case STAGE.test:
      return SIGNING_KEYS.test.publicKey
    default:
      return SIGNING_KEYS.production.publicKey
  }
}

/**
 * Retrieves the appropriate verification public key.
 * Defaults to production.
 * @param mode The package mode to retrieve the public key for.
 */
function getVerificationPublicKey(mode?: PackageMode) {
  switch (mode) {
    case STAGE.development:
      return VERIFICATION_KEYS.development.publicKey
    case STAGE.staging:
      return VERIFICATION_KEYS.staging.publicKey
    case STAGE.test:
      return VERIFICATION_KEYS.test.publicKey
    default:
      return VERIFICATION_KEYS.production.publicKey
  }
}

export { getSigningPublicKey, getVerificationPublicKey }
