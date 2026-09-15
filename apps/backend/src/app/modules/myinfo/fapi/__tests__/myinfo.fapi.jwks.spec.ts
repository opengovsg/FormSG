import crypto from 'crypto'

const mockRetrieveJsonContent = jest.fn()

jest.mock('../../../../utils/iac', () => ({
  ...jest.requireActual('../../../../utils/iac'),
  retrieveJsonContent: (args: unknown) => mockRetrieveJsonContent(args),
}))

const PUBLIC_SIG_KEY = {
  kty: 'EC',
  crv: 'P-256',
  x: 'mock-x',
  y: 'mock-y',
  use: 'sig',
  alg: 'ES256',
  kid: 'mock-sig-kid',
}

const PUBLIC_ENC_KEY = {
  kty: 'EC',
  crv: 'P-256',
  x: 'mock-enc-x',
  y: 'mock-enc-y',
  use: 'enc',
  alg: 'ECDH-ES+A256KW',
  kid: 'mock-enc-kid',
}

const PUBLIC_KEYS = [PUBLIC_SIG_KEY, PUBLIC_ENC_KEY]

type TestJwk = JsonWebKey & {
  use: 'sig' | 'enc'
  alg: string
  kid: string
}

let SECRET_SIG_KEY: TestJwk
let SECRET_ENC_KEY: TestJwk
let MATCHING_PUBLIC_KEYS: TestJwk[]

const withoutPrivateMaterial = (jwk: TestJwk): TestJwk => {
  const publicJwk = { ...jwk }
  delete publicJwk.d
  return publicJwk
}

/** getPublicJwks memoises per module instance, so each test loads a fresh one. */
const loadJwks = () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../myinfo.fapi.jwks') as typeof import('../myinfo.fapi.jwks')

describe('myinfo.fapi.jwks', () => {
  beforeAll(async () => {
    const signingKeyPair = (await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair
    const encryptionKeyPair = (await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits'],
    )) as CryptoKeyPair

    SECRET_SIG_KEY = {
      ...(await crypto.subtle.exportKey('jwk', signingKeyPair.privateKey)),
      use: 'sig',
      alg: 'ES256',
      kid: 'secret-sig-kid',
    }
    SECRET_ENC_KEY = {
      ...(await crypto.subtle.exportKey('jwk', encryptionKeyPair.privateKey)),
      use: 'enc',
      alg: 'ECDH-ES+A256KW',
      kid: 'secret-enc-kid',
    }
    MATCHING_PUBLIC_KEYS = [
      withoutPrivateMaterial(SECRET_SIG_KEY),
      withoutPrivateMaterial(SECRET_ENC_KEY),
    ]
  })

  beforeEach(() => {
    jest.resetModules()
    mockRetrieveJsonContent.mockReset()
  })

  describe('getPublicJwks', () => {
    it('should serve a keyset that holds only public keys', () => {
      mockRetrieveJsonContent.mockReturnValue({ keys: PUBLIC_KEYS })

      expect(loadJwks().getPublicJwks()._unsafeUnwrap()).toEqual({
        keys: PUBLIC_KEYS,
      })
    })

    it('should serve every published key so a rotation can list both kids', () => {
      const rotatingSigKey = { ...PUBLIC_SIG_KEY, kid: 'mock-next-sig-kid' }
      mockRetrieveJsonContent.mockReturnValue({
        keys: [...PUBLIC_KEYS, rotatingSigKey],
      })

      expect(loadJwks().getPublicJwks()._unsafeUnwrap()).toEqual({
        keys: [...PUBLIC_KEYS, rotatingSigKey],
      })
    })

    it('should refuse to serve a keyset carrying symmetric key material', () => {
      mockRetrieveJsonContent.mockReturnValue({
        keys: [
          { ...PUBLIC_SIG_KEY, k: 'mock-symmetric-secret' },
          PUBLIC_ENC_KEY,
        ],
      })

      const error = loadJwks().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/carries private key material/)
    })

    it('should refuse to serve a key that is not a well-formed EC public key', () => {
      mockRetrieveJsonContent.mockReturnValue({
        keys: [{ ...PUBLIC_SIG_KEY, x: undefined }, PUBLIC_ENC_KEY],
      })

      const error = loadJwks().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/not a well-formed EC public key/)
    })

    it('should refuse to serve a keyset carrying EC private key material', () => {
      mockRetrieveJsonContent.mockReturnValue({
        keys: [{ ...PUBLIC_SIG_KEY, d: 'mock-private-scalar' }, PUBLIC_ENC_KEY],
      })

      const error = loadJwks().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/carries private key material/)
    })

    it('should refuse to serve a keyset without an encryption key', () => {
      mockRetrieveJsonContent.mockReturnValue({ keys: [PUBLIC_SIG_KEY] })

      const error = loadJwks().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/needs one 'sig' and one 'enc' key/)
    })

    it('should refuse to serve an empty keyset', () => {
      mockRetrieveJsonContent.mockReturnValue({ keys: [] })

      const error = loadJwks().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/needs one 'sig' and one 'enc' key/)
    })
  })

  describe('loadSecretKeys', () => {
    const mockKeysets = (
      secretKeys: TestJwk[] = [SECRET_SIG_KEY, SECRET_ENC_KEY],
      publicKeys: TestJwk[] = MATCHING_PUBLIC_KEYS,
    ) => {
      mockRetrieveJsonContent
        .mockReturnValueOnce({ keys: secretKeys })
        .mockReturnValueOnce({ keys: publicKeys })
    }

    it('should import a published signing and encryption key pair', async () => {
      mockKeysets()

      const keys = (await loadJwks().loadSecretKeys())._unsafeUnwrap()

      expect(keys).toMatchObject({
        sigKid: SECRET_SIG_KEY.kid,
        encKid: SECRET_ENC_KEY.kid,
        encAlg: SECRET_ENC_KEY.alg,
      })
      expect(keys.signingKey.usages).toContain('sign')
      expect(keys.decryptionKey.usages).toContain('deriveBits')
    })

    it('should reject a secret key without private key material', async () => {
      mockKeysets([{ ...SECRET_SIG_KEY, d: undefined }, SECRET_ENC_KEY])

      const error = (await loadJwks().loadSecretKeys())._unsafeUnwrapErr()

      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/not a well-formed EC private key/)
    })

    it('should reject an unsupported encryption algorithm', async () => {
      mockKeysets([SECRET_SIG_KEY, { ...SECRET_ENC_KEY, alg: 'unsupported' }])

      const error = (await loadJwks().loadSecretKeys())._unsafeUnwrapErr()

      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/declares unsupported alg/)
    })

    it('should reject a public key with the same kid but different key material', async () => {
      mockKeysets(undefined, [
        { ...MATCHING_PUBLIC_KEYS[0], x: 'different-x' },
        MATCHING_PUBLIC_KEYS[1],
      ])

      const error = (await loadJwks().loadSecretKeys())._unsafeUnwrapErr()

      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/does not carry a matching key/)
    })

    it('should map a WebCrypto import failure to a config error', async () => {
      const invalidSig = { ...SECRET_SIG_KEY, x: 'invalid' }
      mockKeysets(
        [invalidSig, SECRET_ENC_KEY],
        [withoutPrivateMaterial(invalidSig), MATCHING_PUBLIC_KEYS[1]],
      )

      const error = (await loadJwks().loadSecretKeys())._unsafeUnwrapErr()

      expect(error.name).toBe('MyInfoFapiConfigError')
    })
  })
})
