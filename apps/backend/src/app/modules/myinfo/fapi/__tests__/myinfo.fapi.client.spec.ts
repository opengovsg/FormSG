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

/** getPublicJwks memoises per module instance, so each test loads a fresh one. */
const loadClient = () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../myinfo.fapi.client') as typeof import('../myinfo.fapi.client')

describe('myinfo.fapi.client', () => {
  beforeEach(() => {
    jest.resetModules()
    mockRetrieveJsonContent.mockReset()
  })

  describe('getPublicJwks', () => {
    it('should serve a keyset that holds only public keys', () => {
      mockRetrieveJsonContent.mockReturnValue({ keys: PUBLIC_KEYS })

      expect(loadClient().getPublicJwks()._unsafeUnwrap()).toEqual({
        keys: PUBLIC_KEYS,
      })
    })

    it('should refuse to serve a keyset carrying EC private key material', () => {
      mockRetrieveJsonContent.mockReturnValue({
        keys: [{ ...PUBLIC_SIG_KEY, d: 'mock-private-scalar' }, PUBLIC_ENC_KEY],
      })

      const error = loadClient().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/carries private key material/)
    })

    it('should refuse to serve a keyset without an encryption key', () => {
      mockRetrieveJsonContent.mockReturnValue({ keys: [PUBLIC_SIG_KEY] })

      const error = loadClient().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/needs one 'sig' and one 'enc' key/)
    })

    it('should refuse to serve an empty keyset', () => {
      mockRetrieveJsonContent.mockReturnValue({ keys: [] })

      const error = loadClient().getPublicJwks()._unsafeUnwrapErr()
      expect(error.name).toBe('MyInfoFapiConfigError')
      expect(error.message).toMatch(/needs one 'sig' and one 'enc' key/)
    })
  })
})
