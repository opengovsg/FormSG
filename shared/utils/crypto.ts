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

type EncryptedStringContent = {
  publicKey: string
  nonce: string
  cipherText: string
}

export type EncryptedStringsMessageContent = {
  publicKey: string
  nonce: string
  cipherTexts: string[]
}

export const encryptStringsMessage = (
  plainTexts: string[],
  publicKey: string,
): EncryptedStringsMessageContent => {
  const nonce = nacl.randomBytes(24)
  const generatedKeyPair = _generateKeyPair()

  return {
    publicKey: generatedKeyPair.publicKey,
    nonce: encodeBase64(nonce),
    cipherTexts: encryptStrings(
      plainTexts,
      publicKey,
      nonce,
      generatedKeyPair,
    ).map((content) => content.cipherText),
  }
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
  publicKey: string,
  nonce?: Uint8Array,
  generatedKeyPair?: { publicKey: string; privateKey: string },
): EncryptedStringContent[] => {
  return plainTexts.map((plainText) =>
    encryptString(plainText, publicKey, nonce, generatedKeyPair),
  )
}

const encryptString = (
  plainText: string,
  publicKey: string,
  nonce?: Uint8Array,
  generatedKeyPair?: { publicKey: string; privateKey: string },
): EncryptedStringContent => {
  if (!generatedKeyPair) {
    generatedKeyPair = _generateKeyPair()
  }
  if (!nonce) {
    nonce = nacl.randomBytes(24)
  }
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

export const decryptStringMessage = (
  privateKey: string,
  encryptedStringsMessageContent: EncryptedStringsMessageContent,
): (string | null)[] => {
  const nonce = encryptedStringsMessageContent.nonce
  const publicKey = encryptedStringsMessageContent.publicKey

  return encryptedStringsMessageContent.cipherTexts.map((cipherText) =>
    decryptString(privateKey, {
      publicKey,
      nonce,
      cipherText,
    }),
  )
}

const decryptString = (
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
