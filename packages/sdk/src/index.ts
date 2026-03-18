import { getSigningPublicKey, getVerificationPublicKey } from './util/publicKey'
import Crypto from './crypto'
import CryptoV3 from './crypto-v3'
import { PackageInitParams } from './types'
import Verification from './verification'
import Webhooks from './webhooks'

/**
 * Entrypoint into the FormSG SDK
 *
 * @param {PackageInitParams} config Package initialization config parameters
 * @param {string?} [config.mode] Optional. Initializes public key used for verifying and decrypting in this package. If `config.signingPublicKey` is given, this param will be ignored.
 * @param {string?} [config.webhookSecretKey] Optional. base64 secret key for signing webhooks. If provided, enables generating signature and headers to authenticate webhook data.
 * @param {VerificationOptions?} [config.verificationOptions] Optional. If provided, enables the usage of the verification module.
 */
export = function (config: PackageInitParams = {}) {
  const { webhookSecretKey, mode, verificationOptions } = config
  /**
   * Public key is used for decrypting signed verified content in the `crypto` module, and
   * also for verifying webhook signatures' authenticity in the `wehbooks` module.
   */
  const signingPublicKey = getSigningPublicKey(mode || 'production')
  /**
   * Public key is used for verifying verified field signatures' authenticity in the `verification` module.
   */
  const verificationPublicKey = getVerificationPublicKey(mode || 'production')

  return {
    webhooks: new Webhooks({
      publicKey: signingPublicKey,
      secretKey: webhookSecretKey,
    }),
    crypto: new Crypto({ signingPublicKey }),
    cryptoV3: new CryptoV3({ signingPublicKey }),
    verification: new Verification({
      publicKey: verificationPublicKey,
      secretKey: verificationOptions?.secretKey,
      transactionExpiry: verificationOptions?.transactionExpiry,
    }),
  }
}
