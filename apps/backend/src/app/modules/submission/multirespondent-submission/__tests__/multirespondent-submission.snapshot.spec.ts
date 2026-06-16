import nacl from 'tweetnacl'
import { decodeBase64, encodeUTF8 } from 'tweetnacl-util'

import formsgSdk from 'src/app/config/formsg-sdk'

import { produceFormKeyContentCopy } from '../multirespondent-submission.snapshot'

/**
 * Recovers the plaintext of a storage-mode (form-key) encrypted string using
 * the form secret key, mirroring the SDK's low-level `decryptContent`. Used to
 * assert round-trip recovery of arbitrary (incl. V4-shaped) content, which the
 * public `crypto.decrypt` cannot do because it enforces a FormField[] shape.
 */
function decryptWithFormSecretKey(
  encryptedContent: string,
  formSecretKey: string,
): unknown {
  const [submissionPublicKey, nonceEncrypted] = encryptedContent.split(';')
  const [nonce, encrypted] = nonceEncrypted.split(':').map(decodeBase64)
  const opened = nacl.box.open(
    encrypted,
    nonce,
    decodeBase64(submissionPublicKey),
    decodeBase64(formSecretKey),
  )
  // eslint-disable-next-line typesafe/no-throw-sync-func
  if (!opened) throw new Error('failed to decrypt form-key copy')
  return JSON.parse(encodeUTF8(opened)) as unknown
}

describe('produceFormKeyContentCopy', () => {
  it('should produce content decryptable back to the original with the form secret key (round-trip)', () => {
    const { publicKey: formPublicKey, secretKey: formSecretKey } =
      formsgSdk.crypto.generate()

    // V4-shaped answer objects (the shape shipped to a plumber consumer).
    const content = {
      '5f8a1e2b3c4d5e6f7a8b9c0d': {
        answer: 'hello world',
        fieldType: 'textfield',
        question: 'What is your message?',
      },
    }

    const copy = produceFormKeyContentCopy({
      content,
      formPublicKey,
      contentFormat: 'v4',
    })

    expect(copy.contentFormat).toBe('v4')
    expect(
      decryptWithFormSecretKey(copy.encryptedContent, formSecretKey),
    ).toEqual(content)
  })

  it('should not be decryptable with a different (wrong) form secret key', () => {
    const { publicKey: formPublicKey } = formsgSdk.crypto.generate()
    const { secretKey: otherSecretKey } = formsgSdk.crypto.generate()

    const copy = produceFormKeyContentCopy({
      content: { foo: 'bar' },
      formPublicKey,
      contentFormat: 'v4',
    })

    expect(() =>
      decryptWithFormSecretKey(copy.encryptedContent, otherSecretKey),
    ).toThrow()
  })

  it('should carry through the v1 content format when requested', () => {
    const { publicKey: formPublicKey } = formsgSdk.crypto.generate()

    const copy = produceFormKeyContentCopy({
      content: [],
      formPublicKey,
      contentFormat: 'v1',
    })

    expect(copy.contentFormat).toBe('v1')
  })
})
