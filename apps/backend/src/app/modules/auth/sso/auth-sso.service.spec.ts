import * as oidcClient from 'openid-client'

import { ISsoVarsSchema } from 'src/types'

import { SsoCreateRedirectUrlError } from './auth-sso.errors'
import { AuthSsoServiceClass } from './auth-sso.service'

// Silence logger output during tests
jest.mock('src/app/config/logger', () => ({
  createLoggerWithLabel: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

const mockDiscovery = jest.mocked(oidcClient.discovery)

const VALID_CONFIG: ISsoVarsSchema = {
  discoveryUrl: 'https://sso.example.com/.well-known/openid-configuration',
  clientId: 'real-client-id',
  clientSecret: 'real-secret',
}

// Mirrors the placeholder defaults in sso.config.ts. Kept inline so a future
// drift between schema defaults and the placeholder check is caught here.
const PLACEHOLDER_CONFIG: ISsoVarsSchema = {
  discoveryUrl: 'https://sso.example.com/.well-known/openid-configuration',
  clientId: 'client-id',
  clientSecret: 'test',
}

describe('AuthSsoServiceClass', () => {
  beforeEach(() => {
    mockDiscovery.mockReset()
  })

  describe('getClientConfigResult — misconfigured SSO', () => {
    it('short-circuits to errAsync without calling discovery', async () => {
      const svc = new AuthSsoServiceClass(PLACEHOLDER_CONFIG)

      const result = await svc.getClientConfigResult()

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SsoCreateRedirectUrlError,
      )
      expect(mockDiscovery).not.toHaveBeenCalled()
    })
  })

  describe('getClientConfigResult — discovery retry cooldown', () => {
    // Stub Date.now so we can advance time without touching real timers.
    let fakeNow: number
    let nowSpy: jest.SpyInstance

    beforeEach(() => {
      fakeNow = 1_700_000_000_000
      nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => fakeNow)
    })

    afterEach(() => {
      nowSpy.mockRestore()
    })

    it('reuses the cached rejected promise within the cooldown window', async () => {
      mockDiscovery.mockRejectedValue(new Error('discovery boom'))
      const svc = new AuthSsoServiceClass(VALID_CONFIG)

      const r1 = await svc.getClientConfigResult()
      expect(r1.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(1)

      // Within cooldown (60s default): cached rejection should be reused.
      fakeNow += 30_000

      const r2 = await svc.getClientConfigResult()
      expect(r2.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(1)
    })

    it('retries discovery after the cooldown elapses', async () => {
      mockDiscovery.mockRejectedValue(new Error('discovery boom'))
      const svc = new AuthSsoServiceClass(VALID_CONFIG)

      const r1 = await svc.getClientConfigResult()
      expect(r1.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(1)

      // Past cooldown (60s default): a fresh discovery attempt should be made.
      fakeNow += 61_000

      const r2 = await svc.getClientConfigResult()
      expect(r2.isErr()).toBe(true)
      expect(mockDiscovery).toHaveBeenCalledTimes(2)
    })
  })
})
