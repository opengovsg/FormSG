import expressHandler from '__tests__/unit/backend/helpers/jest-express'

import { limitWhitelistUploadRate } from '../admin-form.middlewares'

const mockLimiter = jest.fn()
// The limiter is created at import time, before mockLimiter is initialised.
jest.mock('src/app/utils/limit-rate', () => ({
  limitRate:
    () =>
    (...args: unknown[]) =>
      mockLimiter(...args),
}))

describe('limitWhitelistUploadRate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should apply the upload rate limit when the save carries a list', () => {
    const req = expressHandler.mockRequest({
      body: { whitelistCsvString: 'S7101844Z' },
    })
    const res = expressHandler.mockResponse()
    const next = jest.fn()

    limitWhitelistUploadRate(req, res, next)

    expect(mockLimiter).toHaveBeenCalledWith(req, res, next)
    expect(next).not.toHaveBeenCalled()
  })

  it.each([
    ['no list', {}],
    ['a list removal', { whitelistCsvString: null }],
    ['an empty list', { whitelistCsvString: '' }],
  ])('should not limit a save with %s', (_, body) => {
    const req = expressHandler.mockRequest({ body })
    const next = jest.fn()

    limitWhitelistUploadRate(req, expressHandler.mockResponse(), next)

    expect(mockLimiter).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
  })
})
