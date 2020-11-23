import { decode as decodeBase64 } from '@stablelib/base64'
import { err, ok, Result } from 'neverthrow'

export const checkIsEncryptedEncoding = (
  encryptedStr: string,
): Result<boolean, Error> => {
  // TODO (#42): Remove this type check once whole backend is in TypeScript.
  if (typeof encryptedStr !== 'string') {
    return err(new Error('encryptedStr is not of type `string`'))
  }

  const [submissionPublicKey, nonceEncrypted] = encryptedStr.split(';')

  if (!nonceEncrypted) {
    return err(new Error('Missing data'))
  }
  const [nonce, encrypted] = nonceEncrypted.split(':')

  if (!submissionPublicKey || !nonce || !encrypted) {
    return err(new Error('Missing data'))
  }

  try {
    // decode throws error if incorrect characters for decoding
    // see https://github.com/StableLib/stablelib/blob/2f3b21e8fcee4aaa77872282fd4ac7a7ff1633f5/packages/base64/base64.ts#L111
    decodeBase64(submissionPublicKey)
    decodeBase64(nonce)
    decodeBase64(encrypted)
    return ok(true)
  } catch (e) {
    return err(new Error('Incorrect characters'))
  }
}
