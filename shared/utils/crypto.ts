import nacl from 'tweetnacl'
import {
  encodeUTF8,
  decodeUTF8,
  encodeBase64,
  decodeBase64,
} from 'tweetnacl-util'

const _generateKeyPair = () => {
  const keyPair = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  }
}

export type EncryptedStringContent = {
  publicKey: string
  nonce: string
  cipherText: string
}

export const encryptStringsMessage = (
  plainTexts: string[],
  publicKey: string,
): EncryptedStringContent[] => {
  const nonce = nacl.randomBytes(24)
  return encryptStrings(plainTexts, nonce, publicKey)
}

/**
 * Encrypts a list of strings with the given nonce and publicKey.
 * Note: each nonce should be unique per message.
 * In this case, this list of strings is considered a single message.
 * @param plainTexts
 * @param nonce
 * @param publicKey
 * @returns
 */
const encryptStrings = (
  plainTexts: string[],
  nonce: Uint8Array,
  publicKey: string,
): EncryptedStringContent[] => {
  return plainTexts.map((plainText) =>
    encryptString(plainText, nonce, publicKey),
  )
}

export const encryptString = (
  plainText: string,
  nonce: Uint8Array,
  publicKey: string,
): EncryptedStringContent => {
  const generatedKeyPair = _generateKeyPair()
  const plainTextBinary = decodeUTF8(plainText)

  return {
    publicKey: generatedKeyPair.publicKey,
    nonce: encodeBase64(nonce),
    cipherText: encodeBase64(
      nacl.box(
        plainTextBinary,
        nonce,
        decodeBase64(publicKey),
        decodeBase64(generatedKeyPair.privateKey),
      ),
    ),
  }
}

export const decryptString = (
  privateKey: string,
  encryptStringContent: EncryptedStringContent,
): string | null => {
  const decryptedBinary = nacl.box.open(
    decodeBase64(encryptStringContent.cipherText),
    decodeBase64(encryptStringContent.nonce),
    decodeBase64(encryptStringContent.publicKey),
    decodeBase64(privateKey),
  )

  if (!decryptedBinary) {
    return null
  }

  return encodeUTF8(decryptedBinary)
}
