import axios from 'axios'
import { createPublicKey } from 'crypto'
import fs from 'fs'
import jwkToPem, { EC } from 'jwk-to-pem'
import { omit } from 'lodash'
import NodeCache from 'node-cache'
import { BaseClient, Issuer } from 'openid-client'

import * as SpcpOidcBaseClientCacheClass from '../spcp.oidc.client.cache'
import { SpcpOidcBaseClientCache } from '../spcp.oidc.client.cache'
import { JwkError } from '../spcp.oidc.client.errors'
import {
  CryptoKeys,
  PublicJwks,
  Refresh,
  SecretJwks,
  SpcpOidcBaseClientCacheConstructorParams,
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

describe('SpcpOidcBaseClientCache', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  const spcpOidcBaseClientCacheConfig: SpcpOidcBaseClientCacheConstructorParams =
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
    it('should correctly call the SpcpOidcBaseClientCache constructor', () => {
      // Arrange
      const constructorSpy = jest
        .spyOn(SpcpOidcBaseClientCacheClass, 'SpcpOidcBaseClientCache')
        .mockReturnValueOnce(undefined as unknown as SpcpOidcBaseClientCache)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )

      // Assert
      expect(spcpOidcBaseClientCache).toBeInstanceOf(SpcpOidcBaseClientCache)
      expect(constructorSpy).toHaveBeenCalledOnce()
      expect(constructorSpy).toHaveBeenCalledWith(spcpOidcBaseClientCacheConfig)
    })

    it('should call refresh() on instantiation', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )

      // Assert
      expect(spcpOidcBaseClientCache).toBeInstanceOf(SpcpOidcBaseClientCache)
      expect(refreshSpy).toHaveBeenCalledOnce()
    })

    it('should correctly set expiry rule and provide a callback function', async () => {
      // Arrange
      const onSpy = jest.spyOn(NodeCache.prototype, 'on')
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )

      // Assert
      expect(spcpOidcBaseClientCache).toBeInstanceOf(SpcpOidcBaseClientCache)
      expect(onSpy).toHaveBeenCalledOnce()
      expect(onSpy).toHaveBeenCalledWith('expired', expect.any(Function))
    })
  })

  describe('getNdiPublicKeys()', () => {
    it('should retrieve and return the keys from the cache and not refresh the cache if key is present', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getSpy = jest
        .spyOn(NodeCache.prototype, 'get')
        .mockReturnValueOnce('keys')

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const ndiPublicKeys = await spcpOidcBaseClientCache.getNdiPublicKeys()

      // Assert

      expect(ndiPublicKeys).toBe('keys')
      expect(refreshSpy).toHaveBeenCalledOnce() // On Instantiation
      expect(getSpy).toHaveBeenCalledOnce()
      expect(getSpy).toHaveBeenCalledWith('ndiPublicKeys')
    })

    it('should attempt to retrieve the keys from the cache and refresh the cache if key is not present', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce({ ndiPublicKeys: 'ok' } as unknown as Refresh)
        .mockResolvedValueOnce({ ndiPublicKeys: 'ok' } as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const ndiPublicKeys = await spcpOidcBaseClientCache.getNdiPublicKeys()

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      expect(ndiPublicKeys).toBe('ok')
    })

    it('should return a rejected promise if key is not present in cache and refresh() returns a rejected promise', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockRejectedValueOnce(new Error('failed'))

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const ndiPublicKeysReusult = spcpOidcBaseClientCache.getNdiPublicKeys()

      // Assert

      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      await expect(ndiPublicKeysReusult).toReject()
    })
  })
  it('should return a rejected promise if refresh fails to resolve within 10s', async () => {
    // Arrange
    const refreshSpy = jest
      .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
      .mockResolvedValueOnce('ok' as unknown as Refresh)
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('ok' as unknown as Refresh), 50000)
          }),
      )

    jest.useFakeTimers()

    // Act
    const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
      spcpOidcBaseClientCacheConfig,
    )
    const baseClientResult = spcpOidcBaseClientCache.getNdiPublicKeys()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getSpy = jest
        .spyOn(NodeCache.prototype, 'get')
        .mockReturnValueOnce('baseClient')

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const baseClient = await spcpOidcBaseClientCache.getBaseClient()

      // Assert

      expect(baseClient).toBe('baseClient')
      expect(refreshSpy).toHaveBeenCalledOnce() // On Instantiation
      expect(getSpy).toHaveBeenCalledOnce()
      expect(getSpy).toHaveBeenCalledWith('baseClient')
    })

    it('should attempt to retrieve the baseClient from the cache and refresh the cache if baseClient is not present', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce({ baseClient: 'ok' } as unknown as Refresh)
        .mockResolvedValueOnce({ baseClient: 'ok' } as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const baseClient = await spcpOidcBaseClientCache.getBaseClient()

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      expect(baseClient).toBe('ok')
    })

    it('should return a rejected promise if baseClient is not present in cache and refresh() returns a rejected promise', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockRejectedValueOnce(new Error('failed'))

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const baseClientResult = spcpOidcBaseClientCache.getBaseClient()

      // Assert

      expect(refreshSpy).toHaveBeenCalledTimes(2) // Once on instantiation, once on key retrieval
      await expect(baseClientResult).toReject()
    })

    it('should return a rejected promise if refresh fails to resolve within 10s', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve('ok' as unknown as Refresh), 50000)
            }),
        )

      jest.useFakeTimers()

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const baseClientResult = spcpOidcBaseClientCache.getBaseClient()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const retryForeverSpy = jest.spyOn(SpOidcUtils, 'retryPromiseForever')

      // Act

      new SpcpOidcBaseClientCache(spcpOidcBaseClientCacheConfig)

      //Assert
      expect(retryForeverSpy).toHaveBeenCalledOnce()
    })

    it('should set the cache correctly and return the correct values', async () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const setSpy = jest.spyOn(NodeCache.prototype, 'set')

      const expectedResult = {
        ndiPublicKeys: 'keys',
        baseClient: 'baseClient',
      }

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      const result = await spcpOidcBaseClientCache.refresh()

      const keysTtl = spcpOidcBaseClientCache._cache.getTtl('ndiPublicKeys')
      const clientTtl = spcpOidcBaseClientCache._cache.getTtl('baseClient')
      const expiryTtl = spcpOidcBaseClientCache._cache.getTtl('expiry') || 0

      // Assert
      expect(setSpy).toHaveBeenCalledTimes(3)
      expect(setSpy).toHaveBeenCalledWith('ndiPublicKeys', 'keys')
      expect(setSpy).toHaveBeenCalledWith('baseClient', 'baseClient')
      expect(setSpy).toHaveBeenLastCalledWith('expiry', 'expiry', 3600)
      expect(spcpOidcBaseClientCache._cache.get('ndiPublicKeys')).toBe('keys')
      expect(spcpOidcBaseClientCache._cache.get('baseClient')).toBe(
        'baseClient',
      )
      expect(spcpOidcBaseClientCache._cache.get('expiry')).toBe('expiry')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const expectedKeyResult = createPublicKeysFromJwks(TEST_NDI_PUBLIC_JWKS)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult =
        await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const expectedKeyResult = createPublicKeysFromJwks(TEST_NDI_PUBLIC_JWKS)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult =
        await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResultPromise =
        spcpOidcBaseClientCache.retrievePublicKeysFromNdi()

      // Assert
      await expect(keyResultPromise).rejects.toThrow('Failure')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrow(JwkError)
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrow(JwkError)
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrow(JwkError)
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrow(JwkError)
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrow(JwkError)
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrow(JwkError)
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult = async () => {
        const key = await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()
        return key
      }

      // Assert
      await expect(keyResult()).rejects.toThrow(JwkError)
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const keyResult =
        await spcpOidcBaseClientCache.retrievePublicKeysFromNdi()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const clientResult =
        await spcpOidcBaseClientCache.retrieveBaseClientFromNdi()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const clientResult =
        await spcpOidcBaseClientCache.retrieveBaseClientFromNdi()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      const clientResult = async () => {
        const result = await spcpOidcBaseClientCache.retrieveBaseClientFromNdi()
        return result
      }

      // Assert
      await expect(clientResult).rejects.toThrow('Failed')
      expect(discoverySpy).toHaveBeenCalledTimes(3)
    })
  })
  describe('refresh()', () => {
    it('should call both retrievePublicKeysFromNdi and retrieveBaseClientFromNdi and return the correct values', async () => {
      // Arrange
      const retrieveKeysSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)

      const retrieveBaseClientSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const expectedResult = {
        ndiPublicKeys: 'keys',
        baseClient: 'baseClient',
      }

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      const result = await spcpOidcBaseClientCache.refresh()

      // Assert
      expect(retrieveKeysSpy).toHaveBeenCalledOnce()
      expect(retrieveBaseClientSpy).toHaveBeenCalledOnce()
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(result).toMatchObject(expectedResult)
    })

    it('should call createRefreshPromise and return the created promise if _refreshPromise does not exist', async () => {
      // Arrange
      const retrieveKeysSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)

      const retrieveBaseClientSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const createRefreshSpy = jest.spyOn(
        SpcpOidcBaseClientCache.prototype,
        'createRefreshPromise',
      )

      const expectedResult = {
        ndiPublicKeys: 'keys',
        baseClient: 'baseClient',
      }

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      const result = await spcpOidcBaseClientCache.refresh()

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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const createRefreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'createRefreshPromise')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      await spcpOidcBaseClientCache.refresh()

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(createRefreshSpy).toHaveBeenCalledOnce()
      expect(spcpOidcBaseClientCache._refreshPromise).toBeUndefined()
    })

    it('should clean up refreshPromise after createRefreshPromise rejects', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const createRefreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'createRefreshPromise')
        .mockRejectedValueOnce(new Error('failed'))

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation

      const attemptRefresh = async () => {
        const result = await spcpOidcBaseClientCache.refresh()
        return result
      }

      // Assert
      await expect(attemptRefresh()).rejects.toThrow('failed')
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(createRefreshSpy).toHaveBeenCalledOnce()
      expect(spcpOidcBaseClientCache._refreshPromise).toBeUndefined()
    })

    it('should return the promise stored in _refreshPromise if it exists', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh) // On instantiation

      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )

      const existingPromise = new Promise((resolve) =>
        resolve('ok'),
      ) as unknown as Promise<Refresh>

      spcpOidcBaseClientCache._refreshPromise = existingPromise

      // Act

      const result = await spcpOidcBaseClientCache.refresh()
      await Promise.resolve() // void refresh after instantiation

      // Assert
      expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
      expect(result).toBe('ok')
    })

    it('should set the cache correctly after calling retrievePublicKeysFromNdi and retrieveBaseClientFromNdi', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrievePublicKeysFromNdi')
        .mockResolvedValueOnce('keys' as unknown as CryptoKeys)

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'retrieveBaseClientFromNdi')
        .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const setSpy = jest.spyOn(NodeCache.prototype, 'set')

      // Act
      const spcpOidcBaseClientCache = new SpcpOidcBaseClientCache(
        spcpOidcBaseClientCacheConfig,
      )
      await Promise.resolve() // void refresh after instantiation
      await spcpOidcBaseClientCache.refresh()

      const keysTtl = spcpOidcBaseClientCache._cache.getTtl('ndiPublicKeys')
      const clientTtl = spcpOidcBaseClientCache._cache.getTtl('baseClient')
      const expiryTtl = spcpOidcBaseClientCache._cache.getTtl('expiry') || 0

      // Assert
      expect(setSpy).toHaveBeenCalledTimes(3)
      expect(setSpy).toHaveBeenCalledWith('ndiPublicKeys', 'keys')
      expect(setSpy).toHaveBeenCalledWith('baseClient', 'baseClient')
      expect(setSpy).toHaveBeenLastCalledWith('expiry', 'expiry', 3600)
      expect(spcpOidcBaseClientCache._cache.get('ndiPublicKeys')).toBe('keys')
      expect(spcpOidcBaseClientCache._cache.get('baseClient')).toBe(
        'baseClient',
      )
      expect(spcpOidcBaseClientCache._cache.get('expiry')).toBe('expiry')
      expect(keysTtl).toBe(0)
      expect(clientTtl).toBe(0)
      expect(Date.now() + 3300 * 1000 - expiryTtl).toBeLessThan(100) // not more than 100ms difference
    })
  })
})
