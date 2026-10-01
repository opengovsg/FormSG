import CryptoBase from './crypto-base'
import CryptoV3 from './crypto-v3'
import { EncryptedContentV3 } from './types'
import {
  DecryptedContentAndAttachmentsV4,
  DecryptedContentV4,
  DecryptParamsV4,
  FieldResponsesV4,
} from './types-v4'

/** V4 webhook interface backed by the existing submission-key encryption. */
export default class CryptoV4 extends CryptoBase {
  private readonly crypto: CryptoV3

  constructor({ signingPublicKey }: { signingPublicKey?: string } = {}) {
    super()
    this.crypto = new CryptoV3({ signingPublicKey })
  }

  /** Encrypt V4 responses with a fresh submission key wrapped by the form key. */
  encrypt = (
    msg: FieldResponsesV4,
    formPublicKey: string
  ): EncryptedContentV3 => this.crypto.encrypt(msg, formPublicKey)

  /**
   * Decrypt webhook data with the form secret key, returning V4 responses.
   * Question text must be supplied in the encrypted webhook content; this
   * interface does not fetch form metadata. Returns null on decryption failure.
   * @throws {MissingPublicKeyError} when signed verified content needs a signing key.
   */
  decrypt = (
    formSecretKey: string,
    decryptParams: DecryptParamsV4
  ): DecryptedContentV4 | null =>
    this.crypto.decryptToV4(formSecretKey, decryptParams, {})

  /** Download and decrypt attachments using the internally unwrapped key. */
  decryptWithAttachments = async (
    formSecretKey: string,
    decryptParams: DecryptParamsV4
  ): Promise<DecryptedContentAndAttachmentsV4 | null> => {
    const content = this.decrypt(formSecretKey, decryptParams)
    if (!content) return null

    const filenames: Record<string, string> = {}
    for (const [fieldId, response] of Object.entries(content.responses)) {
      if (
        response.fieldType === 'attachment' &&
        response.answer !== null &&
        typeof response.answer === 'object' &&
        'value' in response.answer &&
        typeof response.answer.value === 'string'
      ) {
        filenames[fieldId] = response.answer.value
      }
    }
    const attachments = await this.decryptAttachments(
      content.submissionSecretKey,
      decryptParams.attachmentDownloadUrls ?? {},
      filenames
    )
    return attachments ? { content, attachments } : null
  }

  /** Return whether the public and secret keys belong to the same keypair. */
  valid = (publicKey: string, secretKey: string): boolean =>
    this.crypto.valid(publicKey, secretKey)
}
