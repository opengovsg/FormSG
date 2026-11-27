import { Request } from 'express'

const mockConfig = {
  envSiteName: 'uat' as string | null,
  isDev: false,
  rateLimitConfig: { loadTestBypassKey: 'bypass-key' },
}
jest.mock('src/app/config/config', () => ({
  __esModule: true,
  default: mockConfig,
}))

// eslint-disable-next-line import/first
import { isLoadTestRequest } from 'src/app/utils/load-test'

const requestWith = (headers: Record<string, string>) =>
  ({
    get: (name: string) => headers[name.toLowerCase()],
  }) as unknown as Request

describe('isLoadTestRequest', () => {
  beforeEach(() => {
    mockConfig.envSiteName = 'uat'
    mockConfig.isDev = false
    mockConfig.rateLimitConfig.loadTestBypassKey = 'bypass-key'
  })

  it('should return true when the header matches the bypass key', () => {
    expect(
      isLoadTestRequest(requestWith({ 'x-load-test-key': 'bypass-key' })),
    ).toBe(true)
  })

  it('should return false when the header does not match', () => {
    expect(isLoadTestRequest(requestWith({ 'x-load-test-key': 'wrong' }))).toBe(
      false,
    )
  })

  it('should return false when the header is absent', () => {
    expect(isLoadTestRequest(requestWith({}))).toBe(false)
  })

  it('should return false in production even when the header matches', () => {
    mockConfig.envSiteName = 'prod'
    expect(
      isLoadTestRequest(requestWith({ 'x-load-test-key': 'bypass-key' })),
    ).toBe(false)
  })

  it('should return false when no bypass key is configured', () => {
    mockConfig.rateLimitConfig.loadTestBypassKey = ''
    expect(isLoadTestRequest(requestWith({ 'x-load-test-key': '' }))).toBe(
      false,
    )
  })

  it('should return false outside dev when the site name is unset', () => {
    mockConfig.envSiteName = null
    expect(
      isLoadTestRequest(requestWith({ 'x-load-test-key': 'bypass-key' })),
    ).toBe(false)
  })
})
