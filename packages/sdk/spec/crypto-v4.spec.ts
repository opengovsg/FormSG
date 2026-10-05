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

it.each([
  { scenario: 'submitted responses', submittedResponses: responses },
  { scenario: 'no responses', submittedResponses: {} },
])(
  'decrypts a V4 webhook containing $scenario with the form secret key',
  ({ submittedResponses }) => {
    // Prepare: encrypt the responses with a submission key wrapped by the form public key.
    const keys = cryptoV4.generate()
    const encrypted = cryptoV4.encrypt(submittedResponses, keys.publicKey)
    const payload = {
      version: 4,
      encryptedContent: encrypted.encryptedContent,
      encryptedSubmissionSecretKey: encrypted.encryptedSubmissionSecretKey,
    }

    // Act: decrypt the V4 webhook using only the form secret key.
    const result = cryptoV4.decrypt(keys.secretKey, payload)

    // Assert: recover exactly the submitted responses, including an empty response map.
    expect(result?.responses).toEqual(submittedResponses)
  }
)

it('returns null when the form secret key cannot decrypt the V4 webhook', () => {
  // Prepare: a V4 webhook encrypted for another form's keypair.
  const keys = cryptoV4.generate()
  const encrypted = cryptoV4.encrypt(responses, keys.publicKey)
  const otherFormSecretKey = cryptoV4.generate().secretKey

  // Act: decrypt using the other form's secret key.
  const result = cryptoV4.decrypt(otherFormSecretKey, {
    ...encrypted,
    version: 4,
  })

  // Assert: an incorrect form secret key produces no decrypted content.
  expect(result).toBeNull()
})

it('returns null when the V4 webhook encrypted content is malformed', () => {
  // Prepare: a valid wrapped submission key with malformed encrypted content.
  const keys = cryptoV4.generate()
  const encrypted = cryptoV4.encrypt(responses, keys.publicKey)

  // Act: decrypt the V4 webhook with the correct form secret key.
  const result = cryptoV4.decrypt(keys.secretKey, {
    ...encrypted,
    version: 4,
    encryptedContent: 'invalid',
  })

  // Assert: malformed encrypted content produces no decrypted content.
  expect(result).toBeNull()
})

it('recognises a matching form public key and form secret key', () => {
  // Prepare: both keys from the same form keypair.
  const keys = cryptoV4.generate()

  // Act: validate the form keypair.
  const result = cryptoV4.valid(keys.publicKey, keys.secretKey)

  // Assert: keys from the same pair are valid.
  expect(result).toBe(true)
})

it('rejects a form public key paired with another form secret key', () => {
  // Prepare: a public key and a secret key from different form keypairs.
  const keys = cryptoV4.generate()
  const otherFormSecretKey = cryptoV4.generate().secretKey

  // Act: validate the mismatched keys.
  const result = cryptoV4.valid(keys.publicKey, otherFormSecretKey)

  // Assert: keys from different pairs are invalid.
  expect(result).toBe(false)
})

it.each(['decrypt', 'decryptWithAttachments'] as const)(
  '%s excludes step tokens from decrypted V4 webhooks',
  async (method) => {
    // Prepare: a V4 webhook with an extra encrypted step token.
    const sdk = formsg({ mode: 'test' })
    const keys = cryptoV4.generate()
    const encrypted = cryptoV4.encrypt(responses, keys.publicKey)
    const payload = {
      ...encrypted,
      version: 4,
      encryptedStepToken: sdk.crypto.encrypt('step-token', keys.publicKey),
    }

    // Act: decrypt through either V4 webhook consumer method.
    const result = await cryptoV4[method](keys.secretKey, payload)
    const content = result && ('content' in result ? result.content : result)

    // Assert: the result contains only submission content, with no stepToken property.
    expect(content).toStrictEqual({
      submissionSecretKey: encrypted.submissionSecretKey,
      responses,
      verified: undefined,
    })
  }
)

it('returns the step token when decrypting an admin submission', () => {
  // Prepare: an admin submission containing an encrypted step token.
  const sdk = formsg({ mode: 'test' })
  const keys = cryptoV4.generate()
  const encrypted = cryptoV4.encrypt(responses, keys.publicKey)
  const payload = {
    ...encrypted,
    version: 4,
    encryptedStepToken: sdk.crypto.encrypt('step-token', keys.publicKey),
  }

  // Act: decrypt through the admin submission interface.
  const result = sdk.cryptoV3.decryptToV4(keys.secretKey, payload, {})

  // Assert: admin decryption retains the plaintext step token, encoded here as a JSON string.
  expect(result?.stepToken).toBe(JSON.stringify('step-token'))
})

const prepareVerifiedWebhook = () => {
  const keys = cryptoV4.generate()
  const encrypted = cryptoV4.encrypt(responses, keys.publicKey)
  const verified = { uinFin: 'S1234567A' }
  return {
    keys,
    verified,
    payload: {
      ...encrypted,
      version: 4,
      verifiedContent: new Crypto().encrypt(
        verified,
        encrypted.submissionPublicKey,
        SIGNING_KEYS.test.secretKey
      ),
    },
  }
}

it('returns verified content from a V4 webhook when its signature is valid', () => {
  // Prepare: verified content signed with the configured signing keypair.
  const { keys, verified, payload } = prepareVerifiedWebhook()
  const crypto = new CryptoV4({ signingPublicKey: SIGNING_KEYS.test.publicKey })

  // Act: decrypt the V4 webhook and verify the signed content.
  const result = crypto.decrypt(keys.secretKey, payload)

  // Assert: return both submitted responses and authenticated verified content.
  expect(result).toMatchObject({ responses, verified })
})

it('throws when V4 webhook verified content has no configured signing public key', () => {
  // Prepare: signed verified content and an SDK instance without a signing public key.
  const { keys, payload } = prepareVerifiedWebhook()
  const crypto = new CryptoV4()

  // Act: defer decryption so the assertion can inspect the synchronous exception.
  const decrypt = () => crypto.decrypt(keys.secretKey, payload)

  // Assert: missing signing configuration throws MissingPublicKeyError.
  expect(decrypt).toThrow(MissingPublicKeyError)
})

it('returns null when the signing public key cannot verify V4 webhook verified content', () => {
  // Prepare: signed verified content and an unrelated signing public key.
  const { keys, payload } = prepareVerifiedWebhook()
  const crypto = new CryptoV4({ signingPublicKey: keys.publicKey })

  // Act: decrypt the V4 webhook using the incorrect signing public key.
  const result = crypto.decrypt(keys.secretKey, payload)

  // Assert: unverified content makes the whole decryption result null.
  expect(result).toBeNull()
})
