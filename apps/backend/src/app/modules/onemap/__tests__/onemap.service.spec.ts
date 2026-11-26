import type { AxiosStatic } from 'axios'

jest.mock('axios')

type OneMapService = typeof import('../onemap.service')
type OneMapErrors = typeof import('../onemap.errors')

const NOW_SECONDS = 1_800_000_000
const TOKEN_RESPONSE = {
  data: {
    access_token: 'token-1',
    expiry_timestamp: String(NOW_SECONDS + 3 * 24 * 60 * 60),
  },
}
const SEARCH_RESPONSE = {
  data: {
    found: 1,
    results: [{ POSTAL: '200640', BLK_NO: '640', ROAD_NAME: 'ROWELL ROAD' }],
  },
}
const ADDRESS = {
  postalCode: '200640',
  blockNumber: '640',
  streetName: 'ROWELL ROAD',
}

const axiosErrorWithStatus = (status: number) => ({
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  response: { status },
})

describe('onemap.service', () => {
  let MockAxios: jest.Mocked<AxiosStatic>
  let OneMapService: OneMapService
  let OneMapRequestError: OneMapErrors['OneMapRequestError']

  beforeEach(async () => {
    jest.resetModules()
    jest.useFakeTimers().setSystemTime(NOW_SECONDS * 1000)
    MockAxios = jest.mocked((await import('axios')).default)
    MockAxios.isAxiosError.mockImplementation(
      (error: unknown) => !!(error as { isAxiosError?: boolean })?.isAxiosError,
    )
    OneMapService = await import('../onemap.service')
    OneMapRequestError = (await import('../onemap.errors')).OneMapRequestError
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('searchPostalCode', () => {
    it('returns the address and sends the token to OneMap', async () => {
      MockAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE)
      MockAxios.get.mockResolvedValueOnce(SEARCH_RESPONSE)

      const result = await OneMapService.searchPostalCode('200640')

      expect(result._unsafeUnwrap()).toEqual(ADDRESS)
      expect(MockAxios.get).toHaveBeenCalledWith(
        'https://www.onemap.gov.sg/api/common/elastic/search',
        expect.objectContaining({
          params: expect.objectContaining({ searchVal: '200640' }),
          headers: { Authorization: 'token-1' },
        }),
      )
    })

    it('reuses the cached token across searches', async () => {
      MockAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE)
      MockAxios.get.mockResolvedValue(SEARCH_RESPONSE)

      await OneMapService.searchPostalCode('200640')
      await OneMapService.searchPostalCode('200640')

      expect(MockAxios.post).toHaveBeenCalledTimes(1)
      expect(MockAxios.get).toHaveBeenCalledTimes(2)
    })

    it('requests one token for concurrent searches', async () => {
      MockAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE)
      MockAxios.get.mockResolvedValue(SEARCH_RESPONSE)

      await Promise.all([
        OneMapService.searchPostalCode('200640'),
        OneMapService.searchPostalCode('200640'),
      ])

      expect(MockAxios.post).toHaveBeenCalledTimes(1)
    })

    it('requests a new token when the cached one is about to expire', async () => {
      MockAxios.post
        .mockResolvedValueOnce(TOKEN_RESPONSE)
        .mockResolvedValueOnce({
          data: { ...TOKEN_RESPONSE.data, access_token: 'token-2' },
        })
      MockAxios.get.mockResolvedValue(SEARCH_RESPONSE)

      await OneMapService.searchPostalCode('200640')
      jest.setSystemTime((NOW_SECONDS + 3 * 24 * 60 * 60 - 30 * 60) * 1000)
      await OneMapService.searchPostalCode('200640')

      expect(MockAxios.post).toHaveBeenCalledTimes(2)
      expect(MockAxios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: { Authorization: 'token-2' } }),
      )
    })

    it('retries once with a new token when OneMap rejects the token', async () => {
      MockAxios.post
        .mockResolvedValueOnce(TOKEN_RESPONSE)
        .mockResolvedValueOnce({
          data: { ...TOKEN_RESPONSE.data, access_token: 'token-2' },
        })
      MockAxios.get
        .mockRejectedValueOnce(axiosErrorWithStatus(401))
        .mockResolvedValueOnce(SEARCH_RESPONSE)

      const result = await OneMapService.searchPostalCode('200640')

      expect(result._unsafeUnwrap()).toEqual(ADDRESS)
      expect(MockAxios.post).toHaveBeenCalledTimes(2)
      expect(MockAxios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: { Authorization: 'token-2' } }),
      )
    })

    it('returns null when OneMap finds no address', async () => {
      MockAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE)
      MockAxios.get.mockResolvedValueOnce({ data: { found: 0, results: [] } })

      const result = await OneMapService.searchPostalCode('999999')

      expect(result._unsafeUnwrap()).toBeNull()
    })

    it('returns OneMapRequestError when the token request fails', async () => {
      MockAxios.post.mockRejectedValueOnce(axiosErrorWithStatus(400))

      const result = await OneMapService.searchPostalCode('200640')

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(OneMapRequestError)
      expect(MockAxios.get).not.toHaveBeenCalled()
    })

    it('returns OneMapRequestError when the search fails', async () => {
      MockAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE)
      MockAxios.get.mockRejectedValueOnce(axiosErrorWithStatus(500))

      const result = await OneMapService.searchPostalCode('200640')

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(OneMapRequestError)
      expect(MockAxios.post).toHaveBeenCalledTimes(1)
    })
  })
})
