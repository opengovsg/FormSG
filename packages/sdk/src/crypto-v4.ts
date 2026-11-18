import CryptoBase from './crypto-base'
import CryptoV3 from './crypto-v3'
import { EncryptedContentV3 } from './types'
import {
  DecryptedContentAndAttachmentsV4,
  DecryptedContentV4,
  DecryptParamsV4,
  FieldResponsesV4,
} from './types-v4'

/** Encrypt form responses and decrypt webhook submissions in V4 format. */
export default class CryptoV4 extends CryptoBase {
  private readonly crypto: CryptoV3

  constructor({ signingPublicKey }: { signingPublicKey?: string } = {}) {
    super()
    this.crypto = new CryptoV3({ signingPublicKey })
  }

  /**
   * Encrypt V4 form responses using the form's public key.
   * @param msg Responses keyed by field ID.
   * @param formPublicKey The public key of the form.
   * @returns The encrypted submission payload.
   */
  encrypt = (
    msg: FieldResponsesV4,
    formPublicKey: string
  ): EncryptedContentV3 => this.crypto.encrypt(msg, formPublicKey)

  /**
   * Decrypt a webhook submission into V4 responses.
   * @param formSecretKey The secret key of the form.
   * @param decryptParams The encrypted submission data from the webhook payload.
   * @returns The decrypted submission keyed by field ID, or null if decryption fails.
   * @throws {MissingPublicKeyError} If the submission contains signed verified
   * content but no `signingPublicKey` was provided when creating this SDK instance.
   */
  decrypt = (
    formSecretKey: string,
    decryptParams: DecryptParamsV4
  ): DecryptedContentV4 | null => {
    const decrypted = this.crypto.decryptToV4(formSecretKey, decryptParams, {})
    if (!decrypted) return null

    return {
      submissionSecretKey: decrypted.submissionSecretKey,
      responses: decrypted.responses,
      verified: decrypted.verified,
    }
  }

  /**
   * Decrypt a webhook submission into V4 responses, including downloading and decrypting its attachments.
   * @param formSecretKey The secret key of the form.
   * @param decryptParams Encrypted webhook data and `attachmentDownloadUrls`.
   * URLs may be empty or omitted when no files were uploaded.
   * @returns Decrypted content and attachments (filename and file content) keyed
   * by field ID, or null if decryption fails.
   * @note `attachments` is empty when no `attachmentDownloadUrls` are provided.
   * @throws {MissingPublicKeyError} If signed verified content is present but
   * the SDK was created without a `signingPublicKey`.
   */
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
