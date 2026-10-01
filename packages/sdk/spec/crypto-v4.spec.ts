import formsg, { FieldResponsesV4 } from '../src'
import Crypto from '../src/crypto'
import CryptoV4 from '../src/crypto-v4'
import { MissingPublicKeyError } from '../src/errors'
import { SIGNING_KEYS } from '../src/resource/signing-keys'

const { cryptoV4 } = formsg({ mode: 'test' })
const responses: FieldResponsesV4 = {
  name: {
    fieldType: 'textfield',
    question: 'Name',
    answer: { value: 'Alice' },
    provenance: { stepNumber: 0 },
  },
}

it.each([responses, {}])(
  'round-trips V4 responses using only the form key',
  (msg) => {
    const keys = cryptoV4.generate()
    const encrypted = cryptoV4.encrypt(msg, keys.publicKey)
    const payload = {
      version: 4,
      encryptedContent: encrypted.encryptedContent,
      encryptedSubmissionSecretKey: encrypted.encryptedSubmissionSecretKey,
    }
    expect(cryptoV4.decrypt(keys.secretKey, payload)?.responses).toEqual(msg)
    expect(cryptoV4.decrypt(cryptoV4.generate().secretKey, payload)).toBeNull()
    expect(
      cryptoV4.decrypt(keys.secretKey, {
        ...payload,
        encryptedContent: 'invalid',
      })
    ).toBeNull()
  }
)

it('checks matching and mismatched form keys', () => {
  const keys = cryptoV4.generate()
  expect(cryptoV4.valid(keys.publicKey, keys.secretKey)).toBe(true)
  expect(cryptoV4.valid(keys.publicKey, cryptoV4.generate().secretKey)).toBe(
    false
  )
})

it('verifies signed content with the configured signing public key', () => {
  const legacy = new Crypto()
  const keys = cryptoV4.generate()
  const signingKeys = SIGNING_KEYS.test
  const encrypted = cryptoV4.encrypt(responses, keys.publicKey)
  const verified = { uinFin: 'S1234567A' }
  const payload = {
    ...encrypted,
    version: 4,
    verifiedContent: legacy.encrypt(
      verified,
      encrypted.submissionPublicKey,
      signingKeys.secretKey
    ),
  }
  const crypto = new CryptoV4({ signingPublicKey: signingKeys.publicKey })
  expect(crypto.decrypt(keys.secretKey, payload)).toMatchObject({
    responses,
    verified,
  })
  expect(() => new CryptoV4().decrypt(keys.secretKey, payload)).toThrow(
    MissingPublicKeyError
  )
  expect(
    new CryptoV4({ signingPublicKey: keys.publicKey }).decrypt(
      keys.secretKey,
      payload
    )
  ).toBeNull()
})
