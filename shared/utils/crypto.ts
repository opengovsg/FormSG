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
  myPublicKey: string
  nonce: string
  cipherText: string
}

export type EncryptedStringsMessageContent = {
  myPublicKey: string
  nonce: string
  cipherTexts: string[]
}

// Should only be used for encryption which requires lookup as well.
// WARNING: By storing private key, confidentiality is still enforced but authenticity is compromised.
// NOTE: my private key should not be passed to client and should be kept in server only.
// Rationale: This tradeoff is necessary for lookup functionality ie. generate same ciphertext for given plaintext.
export type EncryptedStringsMessageContentWithMyPrivateKey =
  EncryptedStringsMessageContent & {
    myPrivateKey: string
  }

export const encryptStringsMessage = (
  plainTexts: string[],
  peerPublicKey: string,
): EncryptedStringsMessageContentWithMyPrivateKey => {
  const nonce = nacl.randomBytes(24)
  const generatedKeyPair = _generateKeyPair()

  return {
    myPublicKey: generatedKeyPair.publicKey,
    myPrivateKey: generatedKeyPair.privateKey,
    nonce: encodeBase64(nonce),
    cipherTexts: encryptStrings(
      plainTexts,
      peerPublicKey,
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
 * @param peerPublicKey
 * @returns
 */
const encryptStrings = (
  plainTexts: string[],
  peerPublicKey: string,
  nonce?: Uint8Array,
  myKeyPair?: { publicKey: string; privateKey: string },
): EncryptedStringContent[] => {
  return plainTexts.map((plainText) =>
    encryptString(plainText, peerPublicKey, nonce, myKeyPair),
  )
}

export const encryptString = (
  plainText: string,
  peerPublicKey: string,
  nonce?: Uint8Array,
  myKeyPair?: { publicKey: string; privateKey: string },
): EncryptedStringContent => {
  if (!myKeyPair) {
    myKeyPair = _generateKeyPair()
  }
  if (!nonce) {
    nonce = nacl.randomBytes(24)
  }
  const plainTextBinary = decodeUTF8(plainText)

  return {
    myPublicKey: myKeyPair.publicKey,
    nonce: encodeBase64(nonce),
    cipherText: encodeBase64(
      nacl.box(
        plainTextBinary,
        nonce,
        decodeBase64(peerPublicKey),
        decodeBase64(myKeyPair.privateKey),
      ),
    ),
  }
}

export const decryptStringMessage = (
  peerPrivateKey: string,
  encryptedStringsMessageContent: EncryptedStringsMessageContent,
): (string | null)[] => {
  const nonce = encryptedStringsMessageContent.nonce
  const myPublicKey = encryptedStringsMessageContent.myPublicKey

  return encryptedStringsMessageContent.cipherTexts.map((cipherText) =>
    decryptString(peerPrivateKey, {
      myPublicKey,
      nonce,
      cipherText,
    }),
  )
}

const decryptString = (
  peerPrivateKey: string,
  encryptStringContent: EncryptedStringContent,
): string | null => {
  const decryptedBinary = nacl.box.open(
    decodeBase64(encryptStringContent.cipherText),
    decodeBase64(encryptStringContent.nonce),
    decodeBase64(encryptStringContent.myPublicKey),
    decodeBase64(peerPrivateKey),
  )

  if (!decryptedBinary) {
    return null
  }

  return encodeUTF8(decryptedBinary)
}
