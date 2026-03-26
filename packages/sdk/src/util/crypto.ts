import nacl from 'tweetnacl'
import { decodeBase64, encodeBase64, encodeUTF8 } from 'tweetnacl-util'

import {
  EncryptedAttachmentContent,
  EncryptedContent,
  EncryptedFileContent,
  Keypair,
} from '../types'

/**
 * Helper method to generate a new keypair for encryption.
 * @returns The generated keypair.
 */
export const generateKeypair = (): Keypair => {
  const kp = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  }
}

/**
 * Helper function to encrypt input with a unique keypair for each submission.
 * @param msg The message to encrypt
 * @param theirPublicKey The base-64 encoded public key
 * @returns The encrypted basestring
 * @throws error if any of the encrypt methods fail
 */
export const encryptMessage = (
  msg: Uint8Array,
  theirPublicKey: string
): EncryptedContent => {
  const submissionKeypair = generateKeypair()
  const nonce = nacl.randomBytes(24)
  const encrypted = encodeBase64(
    nacl.box(
      msg,
      nonce,
      decodeBase64(theirPublicKey),
      decodeBase64(submissionKeypair.secretKey)
    )
  )
  return `${submissionKeypair.publicKey};${encodeBase64(nonce)}:${encrypted}`
}

/**
 * Helper method to decrypt an encrypted submission.
 * @param formPrivateKey base64
 * @param encryptedContent encrypted string encoded in base64
 * @return The decrypted content, or null if decryption failed.
 */
export const decryptContent = (
  formPrivateKey: string,
  encryptedContent: EncryptedContent
): Uint8Array | null => {
  try {
    const [submissionPublicKey, nonceEncrypted] = encryptedContent.split(';')
    const [nonce, encrypted] = nonceEncrypted.split(':').map(decodeBase64)
    return nacl.box.open(
      encrypted,
      nonce,
      decodeBase64(submissionPublicKey),
      decodeBase64(formPrivateKey)
    )
  } catch (err) {
    return null
  }
}

/**
 * Helper method to verify a signed message.
 * @param msg the message to verify
 * @param publicKey the public key to authenticate the signed message with
 * @returns the signed message if successful, else an error will be thrown
 * @throws {Error} if the message cannot be verified
 */
export const verifySignedMessage = (
  msg: Uint8Array,
  publicKey: string
): Record<string, any> => {
  const openedMessage = nacl.sign.open(msg, decodeBase64(publicKey))
  if (!openedMessage)
    throw new Error('Failed to open signed message with given public key')
  return JSON.parse(encodeUTF8(openedMessage))
}

/**
 * Helper method to check if all the field IDs given are within the filenames
 * @param fieldIds the list of fieldIds to check
 * @param filenames the filenames that should contain the fields
 * @returns boolean indicating whether the fields are valid
 */
export const areAttachmentFieldIdsValid = (
  fieldIds: string[],
  filenames: Record<string, string>
): boolean => {
  return fieldIds.every((fieldId) => filenames[fieldId])
}

/**
 * Converts an encrypted attachment to encrypted file content
 * @param encryptedAttachment The encrypted attachment
 * @returns EncryptedFileContent The encrypted file content
 */
export const convertEncryptedAttachmentToFileContent = (
  encryptedAttachment: EncryptedAttachmentContent
): EncryptedFileContent => ({
  submissionPublicKey: encryptedAttachment.encryptedFile.submissionPublicKey,
  nonce: encryptedAttachment.encryptedFile.nonce,
  binary: decodeBase64(encryptedAttachment.encryptedFile.binary),
})
