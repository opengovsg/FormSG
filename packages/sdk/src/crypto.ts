import axios from 'axios'
import nacl from 'tweetnacl'
import {
  decodeBase64,
  decodeUTF8,
  encodeBase64,
  encodeUTF8,
} from 'tweetnacl-util'

import {
  areAttachmentFieldIdsValid,
  convertEncryptedAttachmentToFileContent,
  decryptContent,
  encryptMessage,
  verifySignedMessage,
} from './util/crypto'
import { determineIsFormFields } from './util/validate'
import { adaptV4ToV1 } from './adapt-v4-to-v1'
import CryptoBase from './crypto-base'
import { isFieldResponsesV4 } from './crypto-v3'
import { AttachmentDecryptionError, MissingPublicKeyError } from './errors'
import {
  DecryptedAttachments,
  DecryptedContent,
  DecryptedContentAndAttachments,
  DecryptParams,
  EncryptedAttachmentContent,
  EncryptedAttachmentRecords,
  EncryptedContent,
  FormField,
} from './types'
import { DecryptedContentV4, FieldResponsesV4 } from './types-v4'

export default class Crypto extends CryptoBase {
  signingPublicKey?: string

  constructor({ signingPublicKey }: { signingPublicKey?: string } = {}) {
    super()
    this.signingPublicKey = signingPublicKey
  }

  /**
   * Encrypt input with a unique keypair for each submission
   * @param encryptionPublicKey The base-64 encoded public key for encrypting.
   * @param msg The message to encrypt, will be stringified.
   * @param signingPrivateKey Optional. Must be a base-64 encoded private key. If given, will be used to signing the given msg param prior to encrypting.
   * @returns The encrypted basestring.
   */
  encrypt = (
    msg: any,
    encryptionPublicKey: string,
    signingPrivateKey?: string
  ): EncryptedContent => {
    let processedMsg = decodeUTF8(JSON.stringify(msg))

    if (signingPrivateKey) {
      processedMsg = nacl.sign(processedMsg, decodeBase64(signingPrivateKey))
    }

    return encryptMessage(processedMsg, encryptionPublicKey)
  }

  /**
   * Decrypts an encrypted submission and returns it.
   * @param formSecretKey The base-64 secret key of the form to decrypt with.
   * @param decryptParams The params containing encrypted content and information.
   * @param decryptParams.encryptedContent The encrypted content encoded with base-64.
   * @param decryptParams.version The version of the payload. Used to determine the decryption process to decrypt the content with.
   * @param decryptParams.verifiedContent Optional. The encrypted and signed verified content. If given, the signingPublicKey will be used to attempt to open the signed message.
   * @returns The decrypted content if successful. Else, null will be returned.
   * @throws {MissingPublicKeyError} if a public key is not provided when instantiating this class and is needed for verifying signed content.
   */
  decrypt = (
    formSecretKey: string,
    decryptParams: DecryptParams
  ): DecryptedContent | null => {
    const decrypted = this.decryptVersioned(formSecretKey, decryptParams)
    if (decrypted === null) return null
    if (Array.isArray(decrypted.responses)) {
      return decrypted as DecryptedContent
    }
    try {
      return {
        responses: adaptV4ToV1(decrypted.responses),
        ...(decrypted.verified !== undefined && {
          verified: decrypted.verified,
        }),
      }
    } catch {
      // Malformed V4 answer shapes abort the whole submission rather than
      // produce partial output.
      return null
    }
  }

  /**
   * Decrypts and verifies signed verified content with the same key that
   * encrypted the submission content.
   * @throws {MissingPublicKeyError} if no signing public key was provided at instantiation.
   * @throws {Error} if decryption or signature verification fails.
   */
  private decryptVerifiedContent = (
    contentSecretKey: string,
    verifiedContent: EncryptedContent
  ): Record<string, any> => {
    if (!this.signingPublicKey) {
      throw new MissingPublicKeyError(
        'Public signing key must be provided when instantiating the Crypto class in order to verify verified content'
      )
    }
    // Decrypted message must be able to be authenticated by the public key.
    const decryptedVerifiedContent = decryptContent(
      contentSecretKey,
      verifiedContent
    )
    if (!decryptedVerifiedContent) {
      throw new Error('Failed to decrypt verified content')
    }
    return verifySignedMessage(decryptedVerifiedContent, this.signingPublicKey)
  }

  /**
   * Decrypts an encrypted submission and returns its content in the version it
   * was submitted in: V1 content (storage-mode envelope) as `DecryptedContent`,
   * V4 content (MRF envelope) as `DecryptedContentV4` including the decrypted
   * per-submission secret key. Consumers discriminate the union with
   * `Array.isArray(result.responses)`.
   * @param formSecretKey The base-64 secret key of the form to decrypt with.
   * @param decryptParams The params containing encrypted content and information.
   * @returns The decrypted content if successful. Else, null will be returned.
   * @throws {MissingPublicKeyError} if a public key is not provided when instantiating this class and is needed for verifying signed content.
   */
  decryptVersioned = (
    formSecretKey: string,
    decryptParams: DecryptParams
  ): DecryptedContent | DecryptedContentV4 | null => {
    try {
      const { encryptedContent, verifiedContent, encryptedSubmissionSecretKey } =
        decryptParams

      let contentSecretKey = formSecretKey
      let submissionSecretKey: string | null = null
      if (encryptedSubmissionSecretKey) {
        const decryptedSubmissionSecretKey = decryptContent(
          formSecretKey,
          encryptedSubmissionSecretKey
        )
        if (decryptedSubmissionSecretKey === null) return null
        submissionSecretKey = encodeBase64(decryptedSubmissionSecretKey)
        contentSecretKey = submissionSecretKey
      }

      const decryptedContent = decryptContent(
        contentSecretKey,
        encryptedContent
      )
      if (!decryptedContent) return null
      const decryptedObject: unknown = JSON.parse(encodeUTF8(decryptedContent))

      if (Array.isArray(decryptedObject)) {
        if (!determineIsFormFields(decryptedObject)) return null
        const verified = verifiedContent
          ? this.decryptVerifiedContent(contentSecretKey, verifiedContent)
          : undefined
        return {
          responses: decryptedObject,
          ...(verified !== undefined && { verified }),
        }
      }

      if (typeof decryptedObject !== 'object' || decryptedObject === null) {
        return null
      }
      // An empty record is a valid V4 submission with no answered fields;
      // `isFieldResponsesV4` alone cannot claim it since it checks the first entry.
      const isV4Record =
        Object.keys(decryptedObject).length === 0 ||
        isFieldResponsesV4(decryptedObject as Record<string, unknown>)
      // V4 content only arrives inside an MRF envelope; without one there is
      // no per-submission secret key to honestly return.
      if (!isV4Record || submissionSecretKey === null) {
        return null
      }

      const verified = verifiedContent
        ? this.decryptVerifiedContent(contentSecretKey, verifiedContent)
        : undefined
      return {
        submissionSecretKey,
        responses: decryptedObject as FieldResponsesV4,
        ...(verified !== undefined && { verified }),
      }
    } catch (err) {
      if (err instanceof MissingPublicKeyError) {
        throw err
      }
      return null
    }
  }

  /**
   * Returns true if a pair of public & secret keys are associated with each other
   * @param publicKey The public key to verify against.
   * @param secretKey The private key to verify against.
   */
  valid = (publicKey: string, secretKey: string) => {
    const testResponse: FormField[] = []
    const internalValidationVersion = 1

    const cipherResponse = this.encrypt(testResponse, publicKey)
    // Use toString here since the return should be an empty array.
    return (
      testResponse.toString() ===
      this.decrypt(secretKey, {
        encryptedContent: cipherResponse,
        version: internalValidationVersion,
      })?.responses.toString()
    )
  }

  /**
   * Decrypts an encrypted submission, and also download and decrypt any attachments alongside it.
   * @param formSecretKey Secret key as a base-64 string
   * @param decryptParams The params containing encrypted content and information.
   * @returns A promise of the decrypted submission, including attachments (if any). Or else returns null if a decryption error decrypting any part of the submission.
   * @throws {MissingPublicKeyError} if a public key is not provided when instantiating this class and is needed for verifying signed content.
   */
  decryptWithAttachments = async (
    formSecretKey: string,
    decryptParams: DecryptParams
  ): Promise<DecryptedContentAndAttachments | null> => {
    const decryptedRecords: DecryptedAttachments = {}
    const filenames: Record<string, string> = {}

    const attachmentRecords: EncryptedAttachmentRecords =
      decryptParams.attachmentDownloadUrls ?? {}
    const decryptedContent = this.decrypt(formSecretKey, decryptParams)
    if (decryptedContent === null) return null

    // Retrieve all original filenames for attachments for easy lookup
    decryptedContent.responses.forEach((response) => {
      if (response.fieldType === 'attachment' && response.answer) {
        filenames[response._id] = response.answer
      }
    })

    const fieldIds = Object.keys(attachmentRecords)
    // Check if all fieldIds are within filenames
    if (!areAttachmentFieldIdsValid(fieldIds, filenames)) {
      return null
    }

    const downloadPromises = fieldIds.map((fieldId) => {
      return (
        axios
          // Retrieve all the attachments as JSON
          .get<EncryptedAttachmentContent>(attachmentRecords[fieldId], {
            responseType: 'json',
          })
          // Decrypt all the attachments
          .then(({ data: downloadResponse }) => {
            const encryptedFile =
              convertEncryptedAttachmentToFileContent(downloadResponse)
            return this.decryptFile(formSecretKey, encryptedFile)
          })
          .then((decryptedFile) => {
            // Check if the file exists and set the filename accordingly; otherwise, throw an error
            if (decryptedFile) {
              decryptedRecords[fieldId] = {
                filename: filenames[fieldId],
                content: decryptedFile,
              }
            } else {
              throw new AttachmentDecryptionError()
            }
          })
      )
    })

    try {
      await Promise.all(downloadPromises)
    } catch {
      return null
    }

    return {
      content: decryptedContent,
      attachments: decryptedRecords,
    }
  }
}
