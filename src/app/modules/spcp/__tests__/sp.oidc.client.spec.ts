import axios from 'axios'
import { createPublicKey } from 'crypto'
import fs from 'fs'
import jwkToPem, { EC } from 'jwk-to-pem'
import { omit } from 'lodash'
import { BaseClient, Issuer } from 'openid-client'

import * as SpOidcClientClasses from '../sp.oidc.client'
import { SpOidcClientCache } from '../sp.oidc.client'
import { JwkError } from '../sp.oidc.client.errors'
import {
  CryptoKeySet,
  PublicJwks,
  Refresh,
  SecretJwks,
  SpOidcClientCacheConstructorParams,
} from '../sp.oidc.client.types'

jest.mock('openid-client')
jest.mock('axios')

jest.useFakeTimers()
const TEST_RP_SECRET_JWKS: SecretJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_rp_secret_jwks.json').toString(),
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

const SP_OIDC_NDI_DISCOVERY_ENDPOINT = 'spOidcNdiDiscoveryEndpoint'
const SP_OIDC_NDI_JWKS_ENDPOINT = 'spOidcNdiJwksEndpoint'
const SP_OIDC_RP_CLIENT_ID = 'spOidcRpClientId'
const SP_OIDC_RP_REDIRECT_URL = 'spOidcRpRedirectUrl'

afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})

describe('SpOidcClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  describe('SpOidcClientCache class', () => {
    const config: SpOidcClientCacheConstructorParams = {
      spOidcNdiDiscoveryEndpoint: SP_OIDC_NDI_DISCOVERY_ENDPOINT,
      spOidcNdiJwksEndpoint: SP_OIDC_NDI_JWKS_ENDPOINT,
      spOidcRpClientId: SP_OIDC_RP_CLIENT_ID,
      spOidcRpRedirectUrl: SP_OIDC_RP_REDIRECT_URL,
      spOidcRpSecretJwks: TEST_RP_SECRET_JWKS,
      options: {
        useClones: false,
        checkperiod: 60,
      },
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

    describe('retrievePublicKeysFromNdi()', () => {
      it('should call the NDI JWKS endpoint and return the correct result', async () => {
        // Arrange
        const axiosSpy = jest
          .spyOn(axios, 'get')
          .mockResolvedValueOnce({ data: TEST_NDI_PUBLIC_JWKS })
        jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        const expectedKeyResult = createPublicKeysFromJwks(TEST_NDI_PUBLIC_JWKS)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = await spOidcClientCache.retrievePublicKeysFromNdi()

        // Assert
        expect(axiosSpy).toHaveBeenCalledOnce()
        expect(keyResult).toMatchObject(expectedKeyResult)
      })

      it('should call the NDI JWKS endpoint and retry 2 more times if it fails', async () => {
        // Arrange
        const axiosSpy = jest
          .spyOn(axios, 'get')
          .mockRejectedValueOnce(new Error())
          .mockRejectedValueOnce(new Error())
          .mockResolvedValueOnce({ data: TEST_NDI_PUBLIC_JWKS })

        jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        const expectedKeyResult = createPublicKeysFromJwks(TEST_NDI_PUBLIC_JWKS)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = await spOidcClientCache.retrievePublicKeysFromNdi()

        // Assert
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
          return key
        }

        // Assert
        await expect(keyResult()).rejects.toThrowError('Failure')
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = async () => {
          const key = await spOidcClientCache.retrievePublicKeysFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const keyResult = await spOidcClientCache.retrievePublicKeysFromNdi()

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
          .mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>)

        const discoverySpy = jest.spyOn(Issuer, 'discover')
        const clientSpy = jest.spyOn(mockIssuer, 'Client')
        const expectedClientResult = mockBaseClient

        jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const clientResult = await spOidcClientCache.retrieveBaseClientFromNdi()

        // Assert
        expect(discoverySpy).toHaveBeenCalledOnce()
        expect(clientSpy).toHaveBeenCalledOnce()
        expect(clientSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: SP_OIDC_RP_CLIENT_ID,
            token_endpoint_auth_method: 'private_key_jwt',
            redirect_uris: [SP_OIDC_RP_REDIRECT_URL],
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
          .mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>)

        const discoverySpy = jest.spyOn(Issuer, 'discover')
        const clientSpy = jest.spyOn(mockIssuer, 'Client')
        const expectedClientResult = mockBaseClient

        jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const clientResult = await spOidcClientCache.retrieveBaseClientFromNdi()

        // Assert
        expect(discoverySpy).toHaveBeenCalledTimes(3)
        expect(clientSpy).toHaveBeenCalledOnce()
        expect(clientSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: SP_OIDC_RP_CLIENT_ID,
            token_endpoint_auth_method: 'private_key_jwt',
            redirect_uris: [SP_OIDC_RP_REDIRECT_URL],
          }),
          TEST_RP_SECRET_JWKS,
        )
        expect(clientResult).toEqual(expectedClientResult)
      })

      it('should call the NDI Discovery endpoint and not retry more than 2 more times if it fails', async () => {
        // Arrange
        Issuer.discover = jest.fn().mockRejectedValue(new Error('Failed'))

        const discoverySpy = jest.spyOn(Issuer, 'discover')

        jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValue('ok' as unknown as Refresh)

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        const clientResult = async () => {
          const result = await spOidcClientCache.retrieveBaseClientFromNdi()
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
          .spyOn(SpOidcClientCache.prototype, 'retrievePublicKeysFromNdi')
          .mockResolvedValueOnce('keys' as unknown as CryptoKeySet)

        const retrieveBaseClientSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'retrieveBaseClientFromNdi')
          .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

        const refreshSpy = jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        const expectedResult = {
          ndiPublicKeys: 'keys',
          baseClient: 'baseClient',
        }

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        await Promise.resolve() // void refresh after instantiation
        const result = await spOidcClientCache.refresh()

        // Assert
        expect(retrieveKeysSpy).toHaveBeenCalledOnce()
        expect(retrieveBaseClientSpy).toHaveBeenCalledOnce()
        expect(refreshSpy).toHaveBeenCalledTimes(2) // once in instantiation, once in act
        expect(result).toMatchObject(expectedResult)
      })

      it('should set the cache correctly after calling retrievePublicKeysFromNdi and retrieveBaseClientFromNdi', async () => {
        // Arrange
        jest
          .spyOn(SpOidcClientCache.prototype, 'retrievePublicKeysFromNdi')
          .mockResolvedValueOnce('keys' as unknown as CryptoKeySet)

        jest
          .spyOn(SpOidcClientCache.prototype, 'retrieveBaseClientFromNdi')
          .mockResolvedValueOnce('baseClient' as unknown as BaseClient)

        jest
          .spyOn(SpOidcClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        const setSpy = jest.spyOn(SpOidcClientCache.prototype, 'set')

        // Act
        const spOidcClientCache = new SpOidcClientCache(config)
        await Promise.resolve() // void refresh after instantiation
        await spOidcClientCache.refresh()

        const keysTtl = spOidcClientCache.getTtl('ndiPublicKeys') || 0
        const clientTtl = spOidcClientCache.getTtl('baseClient') || 0
        const expiryTtl = spOidcClientCache.getTtl('expiry') || 0

        // Assert
        expect(setSpy).toBeCalledTimes(3)
        expect(setSpy).toHaveBeenCalledWith('ndiPublicKeys', 'keys', 3600)
        expect(setSpy).toHaveBeenCalledWith('baseClient', 'baseClient', 3600)
        expect(setSpy).toHaveBeenLastCalledWith('expiry', 'expiry', 3300)
        expect(spOidcClientCache.get('ndiPublicKeys')).toBe('keys')
        expect(spOidcClientCache.get('baseClient')).toBe('baseClient')
        expect(spOidcClientCache.get('expiry')).toBe('expiry')
        expect(Date.now() + 3600 * 1000 - keysTtl).toBeLessThan(100) // not more than 100ms difference
        expect(Date.now() + 3600 * 1000 - clientTtl).toBeLessThan(100)
        expect(Date.now() + 3300 * 1000 - expiryTtl).toBeLessThan(100)
      })
    })
  })
})
