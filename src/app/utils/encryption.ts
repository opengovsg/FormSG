import { decode as decodeBase64 } from '@stablelib/base64'

export const checkIsEncryptedEncoding = (encryptedStr: string): boolean => {
  // TODO (#42): Remove this type check once whole backend is in TypeScript.
  if (typeof encryptedStr !== 'string') {
    throw new Error('encryptedStr is not of type `string`')
  }

  const [submissionPublicKey, nonceEncrypted] = encryptedStr.split(';')
  const [nonce, encrypted] = nonceEncrypted.split(':')
  if (!submissionPublicKey || !nonce || !encrypted) {
    throw new Error('Missing data')
  }

  try {
    decodeBase64(submissionPublicKey)
    decodeBase64(nonce)
    decodeBase64(encrypted)
    return true
  } catch (err) {
    return false
  }
}
