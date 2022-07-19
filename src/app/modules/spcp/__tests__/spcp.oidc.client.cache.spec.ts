import axios from 'axios'
import { createPublicKey } from 'crypto'
import fs from 'fs'
import jwkToPem, { EC } from 'jwk-to-pem'
import { omit } from 'lodash'
import NodeCache from 'node-cache'
import { BaseClient, Issuer } from 'openid-client'

import * as SpcpOidcBaseCilentCacheClass from '../spcp.oidc.client.cache'
import { SpcpOidcBaseCilentCache } from '../spcp.oidc.client.cache'
import { JwkError } from '../spcp.oidc.client.errors'
import {
  CryptoKeys,
  PublicJwks,
  Refresh,
  SecretJwks,
  SpcpOidcBaseCilentCacheConstructorParams,
} from '../spcp.oidc.client.types'
import * as SpOidcUtils from '../spcp.oidc.util'

jest.mock('openid-client')
jest.mock('axios')

const TEST_RP_SECRET_JWKS: SecretJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_sp_rp_secret_jwks.json').toString(),
)
const TEST_NDI_PUBLIC_JWKS: PublicJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_ndi_public_jwks.json').toString(),
)

const createPublicKeysFromJwks = (jwks: PublicJwks) => {
  return jwks.keys.map((jwk) => ({
    kid: jwk.kid,
    use: jwk.use,
    key: createPublicKey(jwkToPem(jwk as unknown as EC)),
  }))
}

const NDI_DISCOVERY_ENDPOINT = 'ndiDiscoveryEndpoint'
const NDI_JWKS_ENDPOINT = 'ndiJwksEndpoint'
const RP_CLIENT_ID = 'rpClientId'
const RP_REDIRECT_URL = 'rpRedirectUrl'

describe('SpcpOidcBaseCilentCache', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  const spcpOidcBaseCilentCacheConfig: SpcpOidcBaseCilentCacheConstructorParams =
    {
      ndiDiscoveryEndpoint: NDI_DISCOVERY_ENDPOINT,
      ndiJwksEndpoint: NDI_JWKS_ENDPOINT,
      rpClientId: RP_CLIENT_ID,
      rpRedirectUrl: RP_REDIRECT_URL,
      rpSecretJwks: TEST_RP_SECRET_JWKS,
      options: {
        useClones: false,
        checkperiod: 60,
      },
    }
  describe('constructor', () => {
    it('should correctly call the SpcpOidcBaseCilentCache constructor', () => {
      // Arrange
      const constructorSpy = jest
        .spyOn(SpcpOidcBaseCilentCacheClass, 'SpcpOidcBaseCilentCache')
        .mockReturnValueOnce(undefined as unknown as SpcpOidcBaseCilentCache)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )

      // Assert
      expect(spcpOidcBaseCilentCache).toBeInstanceOf(SpcpOidcBaseCilentCache)
      expect(constructorSpy).toHaveBeenCalledOnce()
      expect(constructorSpy).toBeCalledWith(spcpOidcBaseCilentCacheConfig)
    })

    it('should call refresh() on instantiation', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )

      // Assert
      expect(spcpOidcBaseCilentCache).toBeInstanceOf(SpcpOidcBaseCilentCache)
      expect(refreshSpy).toHaveBeenCalledOnce()
    })

    it('should correctly set expiry rule and provide a callback function', async () => {
      // Arrange
      const onSpy = jest.spyOn(NodeCache.prototype, 'on')
      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )

      // Assert
      expect(spcpOidcBaseCilentCache).toBeInstanceOf(SpcpOidcBaseCilentCache)
      expect(onSpy).toHaveBeenCalledOnce()
      expect(onSpy).toHaveBeenCalledWith('expired', expect.any(Function))
    })
  })

  describe('getNdiPublicKeys()', () => {
    it('should retrieve and return the keys from the cache and not refresh the cache if key is present', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getSpy = jest
        .spyOn(NodeCache.prototype, 'get')
        .mockReturnValueOnce('keys')

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const ndiPublicKeys = await spcpOidcBaseCilentCache.getNdiPublicKeys()

      // Assert

      expect(ndiPublicKeys).toBe('keys')
      expect(refreshSpy).toHaveBeenCalledOnce() // On Instantiation
      expect(getSpy).toHaveBeenCalledOnce()
      expect(getSpy).toHaveBeenCalledWith('ndiPublicKeys')
    })

    it('should attempt to retrieve the keys from the cache and refresh the cache if key is not present', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce({ ndiPublicKeys: 'ok' } as unknown as Refresh)
        .mockResolvedValueOnce({ ndiPublicKeys: 'ok' } as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const ndiPublicKeys = await spcpOidcBaseCilentCache.getNdiPublicKeys()

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      expect(ndiPublicKeys).toBe('ok')
    })

    it('should return a rejected promise if key is not present in cache and refresh() returns a rejected promise', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockRejectedValueOnce(new Error('failed'))

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const ndiPublicKeysReusult = spcpOidcBaseCilentCache.getNdiPublicKeys()

      // Assert

      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      await expect(ndiPublicKeysReusult).toReject()
    })
  })
  it('should return a rejected promise if refresh fails to resolve within 10s', async () => {
    // Arrange
    const refreshSpy = jest
      .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
      .mockResolvedValueOnce('ok' as unknown as Refresh)
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('ok' as unknown as Refresh), 50000)
          }),
      )

    jest.useFakeTimers()

    // Act
    const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
      spcpOidcBaseCilentCacheConfig,
    )
    const baseClientResult = spcpOidcBaseCilentCache.getNdiPublicKeys()

    jest.advanceTimersByTime(30000)
    // Assert

    expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
    await expect(baseClientResult).toReject()
    jest.useRealTimers()
  })

  describe('getBaseClient()', () => {
    it('should retrieve and return the baseClilent from the cache and not refresh the cache if baseClient is present', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getSpy = jest
        .spyOn(NodeCache.prototype, 'get')
        .mockReturnValueOnce('baseClient')

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const baseClient = await spcpOidcBaseCilentCache.getBaseClient()

      // Assert

      expect(baseClient).toBe('baseClient')
      expect(refreshSpy).toHaveBeenCalledOnce() // On Instantiation
      expect(getSpy).toHaveBeenCalledOnce()
      expect(getSpy).toHaveBeenCalledWith('baseClient')
    })

    it('should attempt to retrieve the baseClient from the cache and refresh the cache if baseClient is not present', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce({ baseClient: 'ok' } as unknown as Refresh)
        .mockResolvedValueOnce({ baseClient: 'ok' } as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const baseClient = await spcpOidcBaseCilentCache.getBaseClient()

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      expect(baseClient).toBe('ok')
    })

    it('should return a rejected promise if baseClient is not present in cache and refresh() returns a rejected promise', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockRejectedValueOnce(new Error('failed'))

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const baseClientResult = spcpOidcBaseCilentCache.getBaseClient()

      // Assert

      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      await expect(baseClientResult).toReject()
    })

    it('should return a rejected promise if refresh fails to resolve within 10s', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve('ok' as unknown as Refresh), 50000)
            }),
        )

      jest.useFakeTimers()

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const baseClientResult = spcpOidcBaseCilentCache.getBaseClient()

      jest.advanceTimersByTime(30000)
      // Assert

      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      await expect(baseClientResult).toReject()
      jest.useRealTimers()
    })
  })

  describe('createRefreshPromise()', () => {
    it('should call retryPromiseForever on retrievePublicKeysFromNdi and retrieveBaseClientFromNdi', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)
      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const retryForeverSpy = jest.spyOn(SpOidcUtils, 'retryPromiseForever')

      // Act

      new SpcpOidcBaseCilentCache(spcpOidcBaseCilentCacheConfig)

      //Assert
      expect(retryForeverSpy).toHaveBeenCalledOnce()
    })

    it('should set the cache correctly and return the correct values', async () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)
      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const setSpy = jest.spyOn(NodeCache.prototype, 'set')

      const expectedResult = {
        ndiPublicKeys: 'keys',
        baseClient: 'baseClient',
      }

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      const result = await spcpOidcBaseCilentCache.refresh()

      const keysTtl = spcpOidcBaseCilentCache._cache.getTtl('ndiPublicKeys')
      const clientTtl = spcpOidcBaseCilentCache._cache.getTtl('baseClient')
      const expiryTtl = spcpOidcBaseCilentCache._cache.getTtl('expiry') || 0

      // Assert
      expect(setSpy).toBeCalledTimes(3)
      expect(setSpy).toHaveBeenCalledWith('ndiPublicKeys', 'keys')
      expect(setSpy).toHaveBeenCalledWith('baseClient', 'baseClient')
      expect(setSpy).toHaveBeenLastCalledWith('expiry', 'expiry', 3600)
      expect(spcpOidcBaseCilentCache._cache.get('ndiPublicKeys')).toBe('keys')
      expect(spcpOidcBaseCilentCache._cache.get('baseClient')).toBe(
        'baseClient',
      )
      expect(spcpOidcBaseCilentCache._cache.get('expiry')).toBe('expiry')
      expect(keysTtl).toBe(0)
      expect(clientTtl).toBe(0)
      expect(Date.now() + 3300 * 1000 - expiryTtl).toBeLessThan(100) // not more than 100ms difference
      expect(result).toMatchObject(expectedResult)
    })
  })

  describe('retrievePublicKeysFromNdi()', () => {
    it('should call the NDI JWKS endpoint and return the correct result', async () => {
      // Arrange
      const axiosSpy = jest
        .spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: TEST_NDI_PUBLIC_JWKS })

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const expectedKeyResult = createPublicKeysFromJwks(TEST_NDI_PUBLIC_JWKS)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult =
        await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()

      // Assert
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(refreshSpy).toHaveBeenCalledOnce()
      expect(keyResult).toMatchObject(expectedKeyResult)
    })

    it('should call the NDI JWKS endpoint and retry 2 more times if it fails', async () => {
      // Arrange
      const axiosSpy = jest
        .spyOn(axios, 'get')
        .mockRejectedValueOnce(new Error())
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce({ data: TEST_NDI_PUBLIC_JWKS })

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const expectedKeyResult = createPublicKeysFromJwks(TEST_NDI_PUBLIC_JWKS)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult =
        await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()

      // Assert
      expect(refreshSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledTimes(3)
      expect(keyResult.length).toEqual(1)
      expect(keyResult).toMatchObject(expectedKeyResult)
    })

    it('should call the NDI JWKS endpoint and not retry more than 2 more times if it fails', async () => {
      // Arrange
      const axiosSpy = jest
        .spyOn(axios, 'get')
        .mockRejectedValueOnce(new Error('Failure'))
        .mockRejectedValueOnce(new Error('Failure'))
        .mockRejectedValueOnce(new Error('Failure'))

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResultPromise =
        spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()

      // Assert
      await expect(keyResultPromise).rejects.toThrowError('Failure')
      expect(axiosSpy).toHaveBeenCalledTimes(3)
    })

    it('should throw an JwkError if the NDI JWKS retrieved does not have the `kty` property', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: TEST_NDI_PUBLIC_JWKS.keys.map((key) => omit(key, 'kty')),
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrowError(JwkError)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an JwkError if the NDI JWKS retrieved does has the `kty` property but it is not set to `EC`', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: TEST_NDI_PUBLIC_JWKS.keys.map((key) => ({
            ...key,
            kty: 'something else',
          })),
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrowError(JwkError)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an JwkError if the NDI JWKS retrieved does not have the `crv` property', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: TEST_NDI_PUBLIC_JWKS.keys.map((key) => omit(key, 'crv')),
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrowError(JwkError)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })
    it('should throw an JwkError if the NDI JWKS retrieved does not have the `x` property', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: TEST_NDI_PUBLIC_JWKS.keys.map((key) => omit(key, 'x')),
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrowError(JwkError)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })
    it('should throw an JwkError if the NDI JWKS retrieved does not have the `y` property', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: TEST_NDI_PUBLIC_JWKS.keys.map((key) => omit(key, 'y')),
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrowError(JwkError)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })
    it('should throw an JwkError if the NDI JWKS retrieved does not have the `kid` property', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: TEST_NDI_PUBLIC_JWKS.keys.map((key) => omit(key, 'kid')),
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrowError(JwkError)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })
    it('should throw an JwkError if the NDI JWKS retrieved does not have the `use` property', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: TEST_NDI_PUBLIC_JWKS.keys.map((key) => omit(key, 'use')),
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrowError(JwkError)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })

    it('should accept if NDI returns more than one key in the JWKS', async () => {
      // Arrange
      const axiosSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          keys: [TEST_NDI_PUBLIC_JWKS.keys[0], TEST_NDI_PUBLIC_JWKS.keys[0]],
        },
      })

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const keyResult =
        await spcpOidcBaseCilentCache.retrievePublicKeysFromNdi()

      // Assert
      expect(keyResult.length).toEqual(2)
      expect(axiosSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('retrieveBaseClientFromNdi()', () => {
    it('should call the NDI Discovery endpoint and return the correct result', async () => {
      // Arrange
      const mockBaseClient = {
        baseClient: 'baseClient',
      } as unknown as BaseClient

      const mockIssuer = {
        Client: jest.fn().mockImplementation(() => {
          return mockBaseClient
        }),
      }

      Issuer.discover = jest
        .fn()
        .mockResolvedValueOnce(mockIssuer as unknown as Issuer<BaseClient>)

      const discoverySpy = jest.spyOn(Issuer, 'discover')
      const clientSpy = jest.spyOn(mockIssuer, 'Client')
      const expectedClientResult = mockBaseClient

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const clientResult =
        await spcpOidcBaseCilentCache.retrieveBaseClientFromNdi()

      // Assert
      expect(discoverySpy).toHaveBeenCalledOnce()
      expect(clientSpy).toHaveBeenCalledOnce()
      expect(clientSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: RP_CLIENT_ID,
          token_endpoint_auth_method: 'private_key_jwt',
          redirect_uris: [RP_REDIRECT_URL],
        }),
        TEST_RP_SECRET_JWKS,
      )
      expect(clientResult).toEqual(expectedClientResult)
    })

    it('should call the NDI Discovery endpoint and retry 2 more times if it fails', async () => {
      // Arrange
      const mockBaseClient = {
        baseClient: 'baseClient',
      } as unknown as BaseClient

      const mockIssuer = {
        Client: jest.fn().mockImplementation(() => {
          return mockBaseClient
        }),
      }

      Issuer.discover = jest
        .fn()
        .mockRejectedValueOnce(new Error())
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce(mockIssuer as unknown as Issuer<BaseClient>)

      const discoverySpy = jest.spyOn(Issuer, 'discover')
      const clientSpy = jest.spyOn(mockIssuer, 'Client')
      const expectedClientResult = mockBaseClient

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const clientResult =
        await spcpOidcBaseCilentCache.retrieveBaseClientFromNdi()

      // Assert
      expect(discoverySpy).toHaveBeenCalledTimes(3)
      expect(clientSpy).toHaveBeenCalledOnce()
      expect(clientSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: RP_CLIENT_ID,
          token_endpoint_auth_method: 'private_key_jwt',
          redirect_uris: [RP_REDIRECT_URL],
        }),
        TEST_RP_SECRET_JWKS,
      )
      expect(clientResult).toEqual(expectedClientResult)
    })

    it('should call the NDI Discovery endpoint and not retry more than 2 more times if it fails', async () => {
      // Arrange
      const discoverySpy = jest
        .spyOn(Issuer, 'discover')
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      const clientResult = async () => {
        const result = await spcpOidcBaseCilentCache.retrieveBaseClientFromNdi()
        return result
      }

      // Assert
      await expect(clientResult).rejects.toThrowError('Failed')
      expect(discoverySpy).toHaveBeenCalledTimes(3)
    })
  })
  describe('refresh()', () => {
    it('should call both retrievePublicKeysFromNdi and retrieveBaseClientFromNdi and return the correct values', async () => {
      // Arrange
      const retrieveKeysSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)

      const retrieveBaseClientSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const expectedResult = {
        ndiPublicKeys: 'keys',
        baseClient: 'baseClient',
      }

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      const result = await spcpOidcBaseCilentCache.refresh()

      // Assert
      expect(retrieveKeysSpy).toHaveBeenCalledOnce()
      expect(retrieveBaseClientSpy).toHaveBeenCalledOnce()
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(result).toMatchObject(expectedResult)
    })

    it('should call createRefreshPromise and return the created promise if _refreshPromise does not exist', async () => {
      // Arrange
      const retrieveKeysSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)

      const retrieveBaseClientSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const createRefreshSpy = jest.spyOn(
        SpcpOidcBaseCilentCache.prototype,
        'createRefreshPromise',
      )

      const expectedResult = {
        ndiPublicKeys: 'keys',
        baseClient: 'baseClient',
      }

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      const result = await spcpOidcBaseCilentCache.refresh()

      // Assert
      expect(retrieveKeysSpy).toHaveBeenCalledOnce()
      expect(retrieveBaseClientSpy).toHaveBeenCalledOnce()
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(createRefreshSpy).toHaveBeenCalledOnce()
      expect(result).toMatchObject(expectedResult)
    })

    it('should clean up refreshPromise after createRefreshPromise resolves', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const createRefreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'createRefreshPromise')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      await spcpOidcBaseCilentCache.refresh()

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(createRefreshSpy).toHaveBeenCalledOnce()
      expect(spcpOidcBaseCilentCache._refreshPromise).toBeUndefined()
    })

    it('should clean up refreshPromise after createRefreshPromise rejects', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const createRefreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'createRefreshPromise')
        .mockRejectedValueOnce(new Error('failed'))

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation

      const attemptRefresh = async () => {
        const result = await spcpOidcBaseCilentCache.refresh()
        return result
      }

      // Assert
      await expect(attemptRefresh()).rejects.toThrowError('failed')
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(createRefreshSpy).toHaveBeenCalledOnce()
      expect(spcpOidcBaseCilentCache._refreshPromise).toBeUndefined()
    })

    it('should return the promise stored in _refreshPromise if it exists', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )

      const existingPromise = new Promise((resolve) =>
        resolve('ok'),
      ) as unknown as Promise<Refresh>

      spcpOidcBaseCilentCache._refreshPromise = existingPromise

      // Act

      const result = await spcpOidcBaseCilentCache.refresh()
      await Promise.resolve() // void refresh after instantiation

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(result).toBe('ok')
    })

    it('should set the cache correctly after calling retrievePublicKeysFromNdi and retrieveBaseClientFromNdi', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      jest
        .spyOn(SpcpOidcBaseCilentCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const setSpy = jest.spyOn(NodeCache.prototype, 'set')

      // Act
      const spcpOidcBaseCilentCache = new SpcpOidcBaseCilentCache(
        spcpOidcBaseCilentCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      await spcpOidcBaseCilentCache.refresh()

      const keysTtl = spcpOidcBaseCilentCache._cache.getTtl('ndiPublicKeys')
      const clientTtl = spcpOidcBaseCilentCache._cache.getTtl('baseClient')
      const expiryTtl = spcpOidcBaseCilentCache._cache.getTtl('expiry') || 0

      // Assert
      expect(setSpy).toBeCalledTimes(3)
      expect(setSpy).toHaveBeenCalledWith('ndiPublicKeys', 'keys')
      expect(setSpy).toHaveBeenCalledWith('baseClient', 'baseClient')
      expect(setSpy).toHaveBeenLastCalledWith('expiry', 'expiry', 3600)
      expect(spcpOidcBaseCilentCache._cache.get('ndiPublicKeys')).toBe('keys')
      expect(spcpOidcBaseCilentCache._cache.get('baseClient')).toBe(
        'baseClient',
      )
      expect(spcpOidcBaseCilentCache._cache.get('expiry')).toBe('expiry')
      expect(keysTtl).toBe(0)
      expect(clientTtl).toBe(0)
      expect(Date.now() + 3300 * 1000 - expiryTtl).toBeLessThan(100) // not more than 100ms difference
    })
  })
})
