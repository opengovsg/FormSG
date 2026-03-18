import axios from 'axios'
import nacl from 'tweetnacl'
import { decodeBase64, decodeUTF8, encodeUTF8 } from 'tweetnacl-util'

import {
  areAttachmentFieldIdsValid,
  convertEncryptedAttachmentToFileContent,
  decryptContent,
  encryptMessage,
  verifySignedMessage,
} from './util/crypto'
import { determineIsFormFields } from './util/validate'
import CryptoBase from './crypto-base'
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
    try {
      const { encryptedContent, verifiedContent } = decryptParams

      // Do not return the transformed object in `_decrypt` function as a signed
      // object is not encoded in UTF8 and is encoded in Base-64 instead.
      const decryptedContent = decryptContent(formSecretKey, encryptedContent)
      if (!decryptedContent) {
        throw new Error('Failed to decrypt content')
      }
      const decryptedObject: Record<string, unknown> = JSON.parse(
        encodeUTF8(decryptedContent)
      )
      if (!determineIsFormFields(decryptedObject)) {
        throw new Error('Decrypted object does not fit expected shape')
      }

      const returnedObject: DecryptedContent = {
        responses: decryptedObject,
      }

      if (verifiedContent) {
        if (!this.signingPublicKey) {
          throw new MissingPublicKeyError(
            'Public signing key must be provided when instantiating the Crypto class in order to verify verified content'
          )
        }
        // Only care if it is the correct shape if verifiedContent exists, since
        // we need to append it to the end.
        // Decrypted message must be able to be authenticated by the public key.
        const decryptedVerifiedContent = decryptContent(
          formSecretKey,
          verifiedContent
        )
        if (!decryptedVerifiedContent) {
          // Returns null if decrypting verified content failed.
          throw new Error('Failed to decrypt verified content')
        }
        const decryptedVerifiedObject = verifySignedMessage(
          decryptedVerifiedContent,
          this.signingPublicKey
        )

        returnedObject.verified = decryptedVerifiedObject
      }

      return returnedObject
    } catch (err) {
      // Should only throw if MissingPublicKeyError.
      // This library should be able to be used to encrypt and decrypt content
      // if the content does not contain verified fields.
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
