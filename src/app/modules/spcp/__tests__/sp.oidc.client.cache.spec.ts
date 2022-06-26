import fs from 'fs'
import * as jose from 'jose'
import { omit } from 'lodash'
import { BaseClient } from 'openid-client'

import * as SpOidcClientClass from '../sp.oidc.client'
import { SpOidcClient } from '../sp.oidc.client'
import * as SpOidcClientCacheClass from '../sp.oidc.client.cache'
import { SpOidcClientCache } from '../sp.oidc.client.cache'
import {
  CreateAuthorisationUrlError,
  ExchangeAuthTokenError,
  GetDecryptionKeyError,
  GetVerificationKeyError,
  JwkError,
} from '../sp.oidc.client.errors'
import {
  CryptoKeys,
  PublicJwks,
  Refresh,
  SecretJwks,
  SpOidcClientConstructorParams,
} from '../sp.oidc.client.types'

jest.mock('openid-client')
jest.mock('axios')
jest.mock('jose')

const TEST_RP_PUBLIC_JWKS: PublicJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_rp_public_jwks.json').toString(),
)
const TEST_RP_SECRET_JWKS: SecretJwks = JSON.parse(
  fs.readFileSync('tests/certs/test_rp_secret_jwks.json').toString(),
)

const SP_OIDC_NDI_DISCOVERY_ENDPOINT = 'spOidcNdiDiscoveryEndpoint'
const SP_OIDC_NDI_JWKS_ENDPOINT = 'spOidcNdiJwksEndpoint'
const SP_OIDC_RP_CLIENT_ID = 'spOidcRpClientId'
const SP_OIDC_RP_REDIRECT_URL = 'spOidcRpRedirectUrl'

describe('SpOidcClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  const spOidcClientConfig: SpOidcClientConstructorParams = {
    spOidcNdiDiscoveryEndpoint: SP_OIDC_NDI_DISCOVERY_ENDPOINT,
    spOidcNdiJwksEndpoint: SP_OIDC_NDI_JWKS_ENDPOINT,
    spOidcRpClientId: SP_OIDC_RP_CLIENT_ID,
    spOidcRpRedirectUrl: SP_OIDC_RP_REDIRECT_URL,
    spOidcRpSecretJwks: TEST_RP_SECRET_JWKS,
    spOidcRpPublicJwks: TEST_RP_PUBLIC_JWKS,
  }

  describe('Constructor', () => {
    it('should correctly call the SpOidcClient constructor', () => {
      // Arrange
      const constructorSpy = jest
        .spyOn(SpOidcClientClass, 'SpOidcClient')
        .mockReturnValueOnce(undefined as unknown as SpOidcClient)

      // Act
      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      // Assert
      expect(spOidcClient).toBeInstanceOf(SpOidcClient)
      expect(constructorSpy).toHaveBeenCalledOnce()
      expect(constructorSpy).toHaveBeenCalledWith(spOidcClientConfig)
    })

    it('should correctly instantiate a SpOidcClientCache', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cacheConstructorSpy = jest
        .spyOn(SpOidcClientCacheClass, 'SpOidcClientCache')
        .mockReturnValueOnce('ok' as unknown as SpOidcClientCache)

      const expectedCacheConstructorParams = {
        ...omit(spOidcClientConfig, 'spOidcRpPublicJwks'),
        options: {
          useClones: false,
          checkperiod: 60,
        },
      }

      // Act
      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      await Promise.resolve()

      // Assert
      expect(spOidcClient).toBeInstanceOf(SpOidcClient)
      expect(cacheConstructorSpy).toHaveBeenCalledOnce()
      expect(cacheConstructorSpy).toHaveBeenCalledWith(
        expectedCacheConstructorParams,
      )
      expect(spOidcClient._spOidcClientCache).toBeInstanceOf(SpOidcClientCache)
    })

    it('should throw JwkError if `alg` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpSecretJwks: {
          keys: spOidcClientConfig.spOidcRpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'alg'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpSecretJwks: {
          keys: spOidcClientConfig.spOidcRpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'kty'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute is present on rp secret jwk but not set to EC', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpSecretJwks: {
          keys: spOidcClientConfig.spOidcRpSecretJwks.keys.map((jwk) => ({
            ...jwk,
            kty: 'something',
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `crv` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpSecretJwks: {
          keys: spOidcClientConfig.spOidcRpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'crv'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `d` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpSecretJwks: {
          keys: spOidcClientConfig.spOidcRpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'd'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `alg` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpPublicJwks: {
          keys: spOidcClientConfig.spOidcRpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'alg'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpPublicJwks: {
          keys: spOidcClientConfig.spOidcRpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'kty'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute is present on rp public jwk but not set to EC', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpPublicJwks: {
          keys: spOidcClientConfig.spOidcRpPublicJwks.keys.map((jwk) => ({
            ...jwk,
            kty: 'something',
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })
    it('should throw JwkError if `crv` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpPublicJwks: {
          keys: spOidcClientConfig.spOidcRpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'crv'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `x` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpPublicJwks: {
          keys: spOidcClientConfig.spOidcRpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'x'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `y` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigNoAlg = {
        ...spOidcClientConfig,
        spOidcRpPublicJwks: {
          keys: spOidcClientConfig.spOidcRpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'y'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigNoAlg as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })
  })

  describe('getNdiPublicKeysFromCache', () => {
    it('should correctly retrieve ndi public keys from cache and resolve if _spOidcClientCache.getNdiPublicKeys resolves', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getNdiKeysSpy = jest
        .spyOn(SpOidcClientCache.prototype, 'getNdiPublicKeys')
        .mockResolvedValueOnce('ok' as unknown as CryptoKeys)

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result = await spOidcClient.getNdiPublicKeysFromCache()

      // Assert

      expect(result).toBe('ok')
      expect(getNdiKeysSpy).toHaveBeenCalledOnce()
    })

    it('should reject if _spOidcClientCache.getNdiPublicKeys rejects', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getNdiKeysSpy = jest
        .spyOn(SpOidcClientCache.prototype, 'getNdiPublicKeys')
        .mockRejectedValueOnce(new Error('Failure'))

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const keyResultPromise = spOidcClient.getNdiPublicKeysFromCache()

      // Assert
      await expect(keyResultPromise).rejects.toThrowError('Failure')
      expect(getNdiKeysSpy).toHaveBeenCalledOnce()
    })
  })

  describe('getBaseClientFromCache', () => {
    it('should correctly retrieve baseClient from cache and resolve if _spOidcClientCache.getBaseClient resolves', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getBaseClientSpy = jest
        .spyOn(SpOidcClientCache.prototype, 'getBaseClient')
        .mockResolvedValueOnce('ok' as unknown as BaseClient)

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result = await spOidcClient.getBaseClientFromCache()

      // Assert

      expect(result).toBe('ok')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })

    it('should reject if _spOidcClientCache.getBaseClient rejects', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getBaseClientSpy = jest
        .spyOn(SpOidcClientCache.prototype, 'getBaseClient')
        .mockRejectedValueOnce(new Error('Failure'))

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const keyResultPromise = spOidcClient.getBaseClientFromCache()

      // Assert
      await expect(keyResultPromise).rejects.toThrowError('Failure')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })
  })

  describe('createAuthorisationUrl', () => {
    it('should throw CreateAuthorisationUrlError if state parameter is empty', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_STATE = ''
      const MOCK_ESRVCID = 'esrvcId'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const createUrl = () =>
        spOidcClient.createAuthorisationUrl(MOCK_EMPTY_STATE, MOCK_ESRVCID)

      // Assert
      await expect(createUrl).rejects.toThrowError(CreateAuthorisationUrlError)
      await expect(createUrl).rejects.toThrowError('Empty state')
    })

    it('should throw CreateAuthorisationUrlError if esrvcId parameter is empty', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_EMPTY_ESRVCID = ''

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const createUrl = () =>
        spOidcClient.createAuthorisationUrl(MOCK_STATE, MOCK_EMPTY_ESRVCID)

      // Assert
      await expect(createUrl).rejects.toThrowError(CreateAuthorisationUrlError)
      await expect(createUrl).rejects.toThrowError('Empty esrvcId')
    })

    it('should reject if getBaseClientFromCache rejects', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_ESRVCID = 'esrvcId'

      const getBaseClientSpy = jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockRejectedValueOnce(new Error('Failed'))

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const tryGetAuthorisationUrl = () =>
        spOidcClient.createAuthorisationUrl(MOCK_STATE, MOCK_ESRVCID)

      // Assert
      await expect(tryGetAuthorisationUrl).rejects.toThrowError('Failed')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })

    it('should correctly return the authorisation url generated by the base client', async () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_ESRVCID = 'esrvcId'
      const MOCK_URL = 'url'

      const mockAuthorisationUrlFn = jest.fn().mockReturnValue(MOCK_URL)

      const getBaseClientSpy = jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          authorizationUrl: mockAuthorisationUrlFn,
        } as unknown as BaseClient)

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = await spOidcClient.createAuthorisationUrl(
        MOCK_STATE,
        MOCK_ESRVCID,
      )

      // Assert
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
      expect(result).toBe(MOCK_URL)
      expect(mockAuthorisationUrlFn).toHaveBeenCalledOnce()
    })
  })

  describe('getDecryptionKey', () => {
    it('should return GetDecryptionKeyError if jwe is empty', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_JWE = ''
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getDecryptionKey(MOCK_EMPTY_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetDecryptionKeyError)
      expect((result as GetDecryptionKeyError).message).toContain(
        'jwe is empty',
      )
    })

    it('should return GetDecryptionKeyError if `kid` does not exist on the jwe header', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWE = 'jwe'
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      jest.spyOn(jose, 'decodeProtectedHeader').mockReturnValueOnce({})

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getDecryptionKey(MOCK_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetDecryptionKeyError)
      expect((result as GetDecryptionKeyError).message).toContain(
        'no kid in idToken JWE',
      )
    })

    it('should return GetDecryptionKeyError if there is no matching `kid` in the keys', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWE = 'jwe'
      const MOCK_KEYS = [
        { kid: 'someKid' },
        { kid: 'anotherKid' },
      ] as unknown as CryptoKeys

      jest
        .spyOn(jose, 'decodeProtectedHeader')
        .mockReturnValueOnce({ kid: 'otherKid' })

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getDecryptionKey(MOCK_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetDecryptionKeyError)
      expect((result as GetDecryptionKeyError).message).toContain(
        'no decryption key matches jwe kid',
      )
    })

    it('should return the first correct decryption key', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWE = 'jwe'
      const MOCK_FIRST_KEY = { kid: 'someKid', key: 'firstKey' }
      const MOCK_SECOND_KEY = { kid: 'anotherKid', key: 'secondKey' }
      const MOCK_THIRD_KEY = { kid: 'someKid', key: 'thirdKey' }
      const MOCK_KEYS = [
        MOCK_FIRST_KEY,
        MOCK_SECOND_KEY,
        MOCK_THIRD_KEY,
      ] as unknown as CryptoKeys

      jest
        .spyOn(jose, 'decodeProtectedHeader')
        .mockReturnValueOnce({ kid: 'someKid' })

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getDecryptionKey(MOCK_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBe(MOCK_FIRST_KEY.key)
    })
  })

  describe('getVerificationKey', () => {
    it('should return GetVerificationKeyError if jws is empty', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_JWS = ''
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getVerificationKey(MOCK_EMPTY_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetVerificationKeyError)
      expect((result as GetVerificationKeyError).message).toContain(
        'jws is empty',
      )
    })

    it('should return GetVerificationKeyError if `kid` does not exist on the jws header', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWS = 'jws'
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      jest.spyOn(jose, 'decodeProtectedHeader').mockReturnValueOnce({})

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getVerificationKey(MOCK_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetVerificationKeyError)
      expect((result as GetVerificationKeyError).message).toContain(
        'no kid in JWS',
      )
    })

    it('should return GetVerificationKeyError if there is no matching `kid` in the keys', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWS = 'jws'
      const MOCK_KEYS = [
        { kid: 'someKid' },
        { kid: 'anotherKid' },
      ] as unknown as CryptoKeys

      jest
        .spyOn(jose, 'decodeProtectedHeader')
        .mockReturnValueOnce({ kid: 'otherKid' })

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getVerificationKey(MOCK_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetVerificationKeyError)
      expect((result as GetVerificationKeyError).message).toContain(
        'no verification key matches jws kid',
      )
    })

    it('should return the first correct verification key', () => {
      // Arrange
      jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWS = 'jws'
      const MOCK_FIRST_KEY = { kid: 'someKid', key: 'firstKey' }
      const MOCK_SECOND_KEY = { kid: 'anotherKid', key: 'secondKey' }
      const MOCK_THIRD_KEY = { kid: 'someKid', key: 'thirdKey' }
      const MOCK_KEYS = [
        MOCK_FIRST_KEY,
        MOCK_SECOND_KEY,
        MOCK_THIRD_KEY,
      ] as unknown as CryptoKeys

      jest
        .spyOn(jose, 'decodeProtectedHeader')
        .mockReturnValueOnce({ kid: 'someKid' })

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getVerificationKey(MOCK_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBe(MOCK_FIRST_KEY.key)
    })
  })

  describe('exchangeAuthCodeAndDecodeVerifyToken', () => {
    it('should throw ExchangeAuthTokenError if authCode is empty and NOT call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpOidcClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_AUTHCODE = ''

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_EMPTY_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrowError(
        ExchangeAuthTokenError,
      )
      await expect(tryExchangeAuthCode).rejects.toThrowError('empty authCode')
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    })
  })
})
