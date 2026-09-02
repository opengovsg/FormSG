const mockRetrieveJsonContent = jest.fn()

jest.mock('../../../../utils/iac', () => ({
  ...jest.requireActual('../../../../utils/iac'),
  retrieveJsonContent: (args: unknown) => mockRetrieveJsonContent(args),
}))

const PUBLIC_EC_KEY = {
  kty: 'EC',
  crv: 'P-256',
  x: 'mock-x',
  y: 'mock-y',
  use: 'sig',
  kid: 'mock-kid',
}

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
      mockRetrieveJsonContent.mockReturnValue({ keys: [PUBLIC_EC_KEY] })

      expect(loadClient().getPublicJwks()).toEqual({ keys: [PUBLIC_EC_KEY] })
    })

    it('should refuse to serve a keyset carrying EC private key material', () => {
      mockRetrieveJsonContent.mockReturnValue({
        keys: [PUBLIC_EC_KEY, { ...PUBLIC_EC_KEY, d: 'mock-private-scalar' }],
      })

      expect(() => loadClient().getPublicJwks()).toThrow(
        /private key material \(d\)/,
      )
    })

    it('should refuse to serve a symmetric key', () => {
      mockRetrieveJsonContent.mockReturnValue({
        keys: [{ kty: 'oct', k: 'mock-secret' }],
      })

      expect(() => loadClient().getPublicJwks()).toThrow(
        /private key material \(k\)/,
      )
    })

    it('should refuse to serve an empty keyset', () => {
      mockRetrieveJsonContent.mockReturnValue({ keys: [] })

      expect(() => loadClient().getPublicJwks()).toThrow(/JWKS is empty/)
    })
  })
})
