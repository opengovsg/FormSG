import fs from 'fs'

import * as SpOidcClientClasses from '../sp.oidc.client'
import { SpOidcClientCache } from '../sp.oidc.client'
import {
  Refresh,
  SpOidcClientCacheConstructorParams,
} from '../sp.oidc.client.types'

jest.mock('openid-client')
jest.useFakeTimers()

describe('SpOidcClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  describe('SpOidcClientCache class', () => {
    const spOidcRpSecretJwks = JSON.parse(
      fs.readFileSync('./tests/certs/test_secret_jwks.json').toString(),
    )

    const config: SpOidcClientCacheConstructorParams = {
      spOidcNdiDiscoveryEndpoint: 'spOidcNdiDiscoveryEndpoint',
      spOidcNdiJwksEndpoint: 'spOidcNdiJwksEndpoint',
      spOidcRpClientId: 'spOidcRpClientId',
      spOidcRpRedirectUrl: 'spOidcRpRedirectUrl',
      spOidcRpSecretJwks,
    }
    describe('constructor', () => {
      it('should correctly call the SpOidcClientCache constructor', () => {
        // Arrange
        const constructorSpy = jest
          .spyOn(SpOidcClientClasses, 'SpOidcClientCache')
          .mockReturnValueOnce(undefined as unknown as SpOidcClientCache)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)

        // Assert
        expect(spOidcClientCache).toBeInstanceOf(SpOidcClientCache)
        expect(constructorSpy).toHaveBeenCalledOnce()
      })

      it('should call refresh() on instantiation', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)

        // Assert
        expect(spOidcClientCache).toBeInstanceOf(SpOidcClientCache)
        expect(refreshSpy).toHaveBeenCalledOnce()
      })

      it('should call console.warn if refresh() attempt on instantiation fails', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockRejectedValueOnce(new Error('failed'))

        const warnSpy = jest
          .spyOn(console, 'warn')
          .mockImplementationOnce(() => undefined)
        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        await Promise.resolve('ok') // Add promise to PromiseJobs queue as refresh() is void in constructor

        // Assert
        expect(spOidcClientCache).toBeInstanceOf(SpOidcClientCache)
        expect(warnSpy).toHaveBeenCalledOnce()
        expect(refreshSpy).toHaveBeenCalledOnce()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Attempted but failed to refresh sp oidc on instantiation',
          ),
        )
      })

      it('should correctly set expiry rule and provide a callback function', async () => {
        // Arrange
        const onSpy = jest.spyOn(SpOidcClientCache.prototype, 'on')
        jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)

        // Assert
        expect(spOidcClientCache).toBeInstanceOf(SpOidcClientCache)
        expect(onSpy).toHaveBeenCalledOnce()
        expect(onSpy).toHaveBeenCalledWith('expired', expect.any(Function))
      })
    })

    describe('getNdiPublicKeys()', () => {
      it('should retrieve and return the keys from the cache and not refresh the cache if key is present', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        const getSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'get')
          .mockReturnValue('keys')

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const ndiPublicKeys = await spOidcClientCache.getNdiPublicKeys()

        // Assert

        expect(ndiPublicKeys).toBe('keys')
        expect(refreshSpy).toHaveBeenCalledOnce() // On Instantiation
        expect(getSpy).toHaveBeenCalledOnce()
        expect(getSpy).toHaveBeenCalledWith('ndiPublicKeys')
      })

      it('should attempt to retrieve the keys from the cache and refresh the cache if key is not present', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue({ ndiPublicKeys: 'ok' } as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const ndiPublicKeys = await spOidcClientCache.getNdiPublicKeys()

        // Assert
        expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
        expect(ndiPublicKeys).toBe('ok')
      })

      it('should return a rejected promise if key is not present in cache and refresh() returns a rejected promise', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)
          .mockRejectedValueOnce(new Error('failed'))

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const ndiPublicKeysReusult = spOidcClientCache.getNdiPublicKeys()

        // Assert

        expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
        await expect(ndiPublicKeysReusult).toReject()
      })
    })

    describe('getBaseClient()', () => {
      it('should retrieve and return the baseClilent from the cache and not refresh the cache if baseClient is present', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        const getSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'get')
          .mockReturnValue('baseClient')

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const baseClient = await spOidcClientCache.getBaseClient()

        // Assert

        expect(baseClient).toBe('baseClient')
        expect(refreshSpy).toHaveBeenCalledOnce() // On Instantiation
        expect(getSpy).toHaveBeenCalledOnce()
        expect(getSpy).toHaveBeenCalledWith('baseClient')
      })

      it('should attempt to retrieve the baseClient from the cache and refresh the cache if baseClient is not present', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue({ baseClient: 'ok' } as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const baseClient = await spOidcClientCache.getBaseClient()

        // Assert
        expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
        expect(baseClient).toBe('ok')
      })

      it('should return a rejected promise if baseClient is not present in cache and refresh() returns a rejected promise', async () => {
        // Arrange
        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)
          .mockRejectedValueOnce(new Error('failed'))

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const baseClientResult = spOidcClientCache.getNdiPublicKeys()

        // Assert

        expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
        await expect(baseClientResult).toReject()
      })
    })
  })
})
