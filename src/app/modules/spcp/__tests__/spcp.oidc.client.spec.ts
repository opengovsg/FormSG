import axios from 'axios'
import { createPrivateKey, createPublicKey } from 'crypto'
import * as jose from 'jose'
import { JWTVerifyResult } from 'jose'
import jwkToPem from 'jwk-to-pem'
import { omit } from 'lodash'
import { BaseClient } from 'openid-client'

import * as SpcpOidcClientClass from '../spcp.oidc.client'
import { CpOidcClient, SpOidcClient } from '../spcp.oidc.client'
import * as SpcpOidcBaseClientCacheClass from '../spcp.oidc.client.cache'
import { SpcpOidcBaseClientCache } from '../spcp.oidc.client.cache'
import {
  CreateAuthorisationUrlError,
  CreateJwtError,
  ExchangeAuthTokenError,
  GetDecryptionKeyError,
  GetSigningKeyError,
  GetVerificationKeyError,
  InvalidIdTokenError,
  JwkError,
  MissingIdTokenError,
  VerificationKeyError,
} from '../spcp.oidc.client.errors'
import {
  CPJWTVerifyResult,
  CryptoKeys,
  Refresh,
  SigningKey,
} from '../spcp.oidc.client.types'

import {
  cpOidcClientConfig,
  spOidcClientConfig,
  TEST_CP_RP_PUBLIC_JWKS,
  TEST_CP_RP_SECRET_JWKS,
  TEST_NDI_PUBLIC_JWKS,
  TEST_NDI_SECRET_JWKS,
  TEST_SP_RP_PUBLIC_JWKS,
  TEST_SP_RP_SECRET_JWKS,
} from './spcp.oidc.test.constants'
import {
  CP_OIDC_NDI_DISCOVERY_ENDPOINT,
  CP_OIDC_NDI_JWKS_ENDPOINT,
  CP_OIDC_RP_CLIENT_ID,
  CP_OIDC_RP_REDIRECT_URL,
  SP_OIDC_NDI_DISCOVERY_ENDPOINT,
  SP_OIDC_NDI_JWKS_ENDPOINT,
  SP_OIDC_RP_CLIENT_ID,
  SP_OIDC_RP_REDIRECT_URL,
} from './spcp.test.constants'

jest.mock('openid-client')
jest.mock('axios')

describe('SpOidcClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should correctly call the SpOidcClient constructor', () => {
      // Arrange
      const constructorSpy = jest
        .spyOn(SpcpOidcClientClass, 'SpOidcClient')
        .mockReturnValueOnce(undefined as unknown as SpOidcClient)

      // Act
      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      // Assert
      expect(spOidcClient).toBeInstanceOf(SpOidcClient)
      expect(constructorSpy).toHaveBeenCalledOnce()
      expect(constructorSpy).toHaveBeenCalledWith(spOidcClientConfig)
    })

    it('should correctly instantiate a SpcpOidcBaseClientCache', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cacheConstructorSpy = jest
        .spyOn(SpcpOidcBaseClientCacheClass, 'SpcpOidcBaseClientCache')
        .mockReturnValueOnce('ok' as unknown as SpcpOidcBaseClientCache)

      const expectedCacheConstructorParams = {
        ndiDiscoveryEndpoint: SP_OIDC_NDI_DISCOVERY_ENDPOINT,
        ndiJwksEndpoint: SP_OIDC_NDI_JWKS_ENDPOINT,
        rpClientId: SP_OIDC_RP_CLIENT_ID,
        rpRedirectUrl: SP_OIDC_RP_REDIRECT_URL,
        rpSecretJwks: TEST_SP_RP_SECRET_JWKS,
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
      expect(spOidcClient._spcpOidcBaseClientCache).toBeInstanceOf(
        SpcpOidcBaseClientCache,
      )
    })

    it('should throw JwkError if `alg` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'alg'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'kty'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute is present on rp secret jwk but not set to EC', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...jwk,
            kty: 'something',
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `crv` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'crv'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `d` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'd'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `alg` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'alg'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'kty'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute is present on rp public jwk but not set to EC', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...jwk,
            kty: 'something',
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })
    it('should throw JwkError if `crv` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'crv'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `x` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpPublicJwks: {
          keys: spOidcClientConfig.rpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'x'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `y` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigIncorrect = {
        ...spOidcClientConfig,
        rpPublicJwks: {
          keys: spOidcClientConfig.rpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'y'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new SpOidcClient(
          spOidcClientConfigIncorrect as unknown as typeof spOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })
  })

  describe('getNdiPublicKeysFromCache', () => {
    it('should correctly retrieve ndi public keys from cache and resolve if _spcpOidcBaseClientCache.getNdiPublicKeys resolves', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getNdiKeysSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getNdiPublicKeys')
        .mockResolvedValueOnce('ok' as unknown as CryptoKeys)

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result = await spOidcClient.getNdiPublicKeysFromCache()

      // Assert

      expect(result).toBe('ok')
      expect(getNdiKeysSpy).toHaveBeenCalledOnce()
    })

    it('should reject if _spcpOidcBaseClientCache.getNdiPublicKeys rejects', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getNdiKeysSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getNdiPublicKeys')
        .mockRejectedValueOnce(new Error('Failure'))

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const keyResultPromise = spOidcClient.getNdiPublicKeysFromCache()

      // Assert
      await expect(keyResultPromise).rejects.toThrow('Failure')
      expect(getNdiKeysSpy).toHaveBeenCalledOnce()
    })
  })

  describe('getBaseClientFromCache', () => {
    it('should correctly retrieve baseClient from cache and resolve if _spcpOidcBaseClientCache.getBaseClient resolves', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getBaseClientSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getBaseClient')
        .mockResolvedValueOnce('ok' as unknown as BaseClient)

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result = await spOidcClient.getBaseClientFromCache()

      // Assert

      expect(result).toBe('ok')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })

    it('should reject if _spcpOidcBaseClientCache.getBaseClient rejects', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getBaseClientSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getBaseClient')
        .mockRejectedValueOnce(new Error('Failure'))

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const tryGetBaseClient = spOidcClient.getBaseClientFromCache()

      // Assert
      await expect(tryGetBaseClient).rejects.toThrow('Failure')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })
  })

  describe('createAuthorisationUrl', () => {
    it('should throw CreateAuthorisationUrlError if state parameter is empty', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_STATE = ''
      const MOCK_ESRVCID = 'esrvcId'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const tryCreateUrl = spOidcClient.createAuthorisationUrl(
        MOCK_EMPTY_STATE,
        MOCK_ESRVCID,
      )

      // Assert
      await expect(tryCreateUrl).rejects.toThrow(CreateAuthorisationUrlError)
      await expect(tryCreateUrl).rejects.toThrow('Empty state')
    })

    it('should throw CreateAuthorisationUrlError if esrvcId parameter is empty', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_EMPTY_ESRVCID = ''

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const tryCreateUrl = spOidcClient.createAuthorisationUrl(
        MOCK_STATE,
        MOCK_EMPTY_ESRVCID,
      )

      // Assert
      await expect(tryCreateUrl).rejects.toThrow(CreateAuthorisationUrlError)
      await expect(tryCreateUrl).rejects.toThrow('Empty esrvcId')
    })

    it('should reject if getBaseClientFromCache rejects', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_ESRVCID = 'esrvcId'

      const getBaseClientSpy = jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockRejectedValueOnce(new Error('Failed'))

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const tryGetAuthorisationUrl = spOidcClient.createAuthorisationUrl(
        MOCK_STATE,
        MOCK_ESRVCID,
      )

      // Assert
      await expect(tryGetAuthorisationUrl).rejects.toThrow('Failed')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })

    it('should correctly call authorisationUrl with esrvc param for Singpass and return the authorisation url generated by the base client', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
      expect(mockAuthorisationUrlFn).toHaveBeenCalledWith(
        expect.objectContaining({ esrvc: MOCK_ESRVCID }),
      )
      expect(mockAuthorisationUrlFn).not.toHaveBeenCalledWith(
        expect.objectContaining({ esrvcID: MOCK_ESRVCID }),
      )
    })
  })

  describe('getDecryptionKey', () => {
    it('should return GetDecryptionKeyError if jwe is empty', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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
    const MOCK_SUB_CLAIM = 's=S1234567D'
    const createMockJws = async () => {
      const MOCK_JWS = await new jose.SignJWT({})
        .setSubject(MOCK_SUB_CLAIM)
        .setProtectedHeader({
          alg: 'ES512',
          kid: TEST_NDI_SECRET_JWKS.keys.find((key) => key.use === 'sig')?.kid,
        })
        .sign(
          createPrivateKey(
            jwkToPem(
              TEST_NDI_SECRET_JWKS.keys.find(
                (key) => key.use === 'sig',
              ) as unknown as jwkToPem.ECPrivate,
              { private: true },
            ),
          ),
        )
      return MOCK_JWS
    }

    const createMockJwe = async () => {
      const MOCK_JWS = await createMockJws()
      const MOCK_JWE = await new jose.CompactEncrypt(
        new TextEncoder().encode(MOCK_JWS),
      )
        .setProtectedHeader({
          alg: 'ECDH-ES+A256KW',
          enc: 'A256CBC-HS512',
          kid: TEST_SP_RP_PUBLIC_JWKS.keys.find((key) => key.use === 'enc')
            ?.kid,
        })
        .encrypt(
          createPublicKey(
            jwkToPem(
              TEST_SP_RP_PUBLIC_JWKS.keys.find(
                (key) => key.use === 'enc',
              ) as unknown as jwkToPem.EC,
            ),
          ),
        )

      return MOCK_JWE
    }

    const NDI_KEYS = TEST_NDI_PUBLIC_JWKS.keys.map((jwk) => {
      return {
        kid: jwk.kid,
        use: jwk.use,
        // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
        // TODO (#4021): load JWK directly after node upgrade
        key: createPublicKey(jwkToPem(jwk as jwkToPem.EC)),
      }
    })

    const AXIOS_HEADER = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }

    it('should throw ExchangeAuthTokenError if authCode is empty and NOT call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_AUTHCODE = ''

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_EMPTY_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(ExchangeAuthTokenError)
      await expect(tryExchangeAuthCode).rejects.toThrow('empty authCode')
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if failed to retrieve baseClient from cache and NOT call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockRejectedValueOnce(new Error('failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow('failed')
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if exchange at token endpoint fails and call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockRejectedValueOnce(new Error('failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow('failed')
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw a MissingIdTokenError if tokenSet does not contain idToken and call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: {} })

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(MissingIdTokenError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw a MissingIdTokenError if tokenSet contains empty idToken and call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: '' } })

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(MissingIdTokenError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should return the correct payload containing the nric sub if idToken is valid', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(SpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockResolvedValueOnce(NDI_KEYS)

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result = await spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(
        MOCK_AUTHCODE,
      )

      // Assert
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(result.payload.sub).toBeDefined()
      expect(result.payload.sub).toBe(MOCK_SUB_CLAIM)
    })

    it('should throw a GetDecryptionKeyError if fails to obtain the correct decryption key and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)
      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })
      jest
        .spyOn(SpOidcClient.prototype, 'getDecryptionKey')
        .mockReturnValueOnce(new GetDecryptionKeyError())

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(GetDecryptionKeyError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw a GetDecryptionKeyError if decryption fails and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(SpOidcClient.prototype, 'getDecryptionKey')
        .mockReturnValueOnce(new GetDecryptionKeyError())

      jest
        .spyOn(jose, 'compactDecrypt')
        .mockRejectedValueOnce(new Error('decrypt failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(GetDecryptionKeyError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw an ExchangeAuthTokenError if fails to retrieve NDI public keys from cache and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(SpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockRejectedValueOnce('getNdiKeysfailed')

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(ExchangeAuthTokenError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw an GetVerificationKeyError if fails to get verification key and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(SpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockResolvedValueOnce(NDI_KEYS)

      jest
        .spyOn(SpOidcClient.prototype, 'getVerificationKey')
        .mockReturnValueOnce(new GetVerificationKeyError())

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert

      await expect(tryExchangeAuthCode).rejects.toThrow(GetVerificationKeyError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw an error if fails to verify id token and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(SpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockResolvedValueOnce(NDI_KEYS)

      jest
        .spyOn(jose, 'jwtVerify')
        .mockRejectedValueOnce(new Error('verify jwt failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const tryExchangeAuthCode =
        spOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow('verify jwt failed')
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('extractNricOrForeignIdFromIdToken', () => {
    it('should return InvalidIdTokenError if sub attribute is missing in payload', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_IDTOKEN_MISSING_SUB = {
        payload: {
          something: 'else',
        },
      } as unknown as JWTVerifyResult

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result = spOidcClient.extractNricOrForeignIdFromIdToken(
        MOCK_IDTOKEN_MISSING_SUB,
      )

      // Assert

      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should return InvalidIdTokenError if parseSub fails', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_IDTOKEN_MALFORMED_SUB = {
        payload: {
          sub: 's=S1234567D,,something=else',
        },
      } as unknown as JWTVerifyResult

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result = spOidcClient.extractNricOrForeignIdFromIdToken(
        MOCK_IDTOKEN_MALFORMED_SUB,
      )

      // Assert

      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should return InvalidIdTokenError if sub does not contain nric', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_IDTOKEN_NONRIC = {
        payload: {
          sub: 'something=else,another=other',
        },
      } as unknown as JWTVerifyResult

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result =
        spOidcClient.extractNricOrForeignIdFromIdToken(MOCK_IDTOKEN_NONRIC)

      // Assert

      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should correctly return the first NRIC from sub when sub contains multiple key value pairs', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const FIRST_NRIC = 'S1234567D'
      const MOCK_SUB_MULTIPLE = `s=${FIRST_NRIC},otherKey=otherValue,s=S9876543C`

      const MOCK_ID_TOKEN = {
        payload: { sub: MOCK_SUB_MULTIPLE },
      } as unknown as JWTVerifyResult

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result =
        spOidcClient.extractNricOrForeignIdFromIdToken(MOCK_ID_TOKEN)

      // Assert

      expect(result).toBe(FIRST_NRIC)
    })

    it('should correctly return the NRIC from sub when sub contains only one key value pair', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const FIRST_NRIC = 'S1234567D'
      const MOCK_SUB_MULTIPLE = `s=${FIRST_NRIC}`

      const MOCK_ID_TOKEN = {
        payload: { sub: MOCK_SUB_MULTIPLE },
      } as unknown as JWTVerifyResult

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result =
        spOidcClient.extractNricOrForeignIdFromIdToken(MOCK_ID_TOKEN)

      // Assert

      expect(result).toBe(FIRST_NRIC)
    })

    it('should correctly return the Foreign ID from sub when sub contains only one key value pair', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_FOREIGN_ID = 'S0001234567D'
      const MOCK_SUB = `s=${MOCK_FOREIGN_ID}`

      const MOCK_ID_TOKEN = {
        payload: { sub: MOCK_SUB },
      } as unknown as JWTVerifyResult

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const result =
        spOidcClient.extractNricOrForeignIdFromIdToken(MOCK_ID_TOKEN)

      // Assert

      expect(result).toBe(MOCK_FOREIGN_ID)
    })
  })

  describe('getSigningKey', () => {
    it('should return the first correct signing key', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const correctKid = TEST_SP_RP_SECRET_JWKS.keys.filter(
        (key) => key.use === 'sig',
      )[0].kid

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)
      const result = spOidcClient.getSigningKey()

      // Assert
      expect((result as SigningKey).kid).toBe(correctKid)
    })

    it('should return GetSigningKeyError if no signing keys are found', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigWithoutSigningKeys = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.filter(
            (key) => key.use !== 'sig',
          ),
        },
      }

      // Act

      const spOidcClient = new SpOidcClient(
        spOidcClientConfigWithoutSigningKeys,
      )
      const result = spOidcClient.getSigningKey()

      // Assert
      expect(result).toBeInstanceOf(GetSigningKeyError)
      expect((result as GetSigningKeyError).message).toContain(
        'No signing keys found',
      )
    })
  })

  describe('createJWT', () => {
    const MOCK_PAYLOAD = {
      key: 'value',
    }

    const MOCK_EXPIRES_IN = 2000

    it('should throw CreateJwtError if no signing keys found', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClientConfigWithoutSigningKeys = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.filter(
            (key) => key.use !== 'sig',
          ),
        },
      }

      // Act

      const spOidcClient = new SpOidcClient(
        spOidcClientConfigWithoutSigningKeys,
      )

      const tryCreateJWT = spOidcClient.createJWT(MOCK_PAYLOAD, MOCK_EXPIRES_IN)

      // Assert

      await expect(tryCreateJWT).rejects.toThrow(CreateJwtError)
      await expect(tryCreateJWT).rejects.toThrow('no signing key found')
    })
  })

  describe('verifyJwt', () => {
    const MOCK_JWT = 'jwt'

    it('should throw VerificationKeyError if no verification key found', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(SpOidcClient.prototype, 'getVerificationKey')
        .mockReturnValueOnce(new GetVerificationKeyError())

      const spOidcClientConfigWithoutVerificationKeys = {
        ...spOidcClientConfig,
        rpSecretJwks: {
          keys: spOidcClientConfig.rpSecretJwks.keys.filter(
            (key) => key.use !== 'sig',
          ),
        },
      }

      // Act

      const spOidcClient = new SpOidcClient(
        spOidcClientConfigWithoutVerificationKeys,
      )

      const tryVerifyJwt = spOidcClient.verifyJwt(MOCK_JWT)

      // Assert

      await expect(tryVerifyJwt).rejects.toThrow(VerificationKeyError)
      await expect(tryVerifyJwt).rejects.toThrow('no verification key found')
    })
  })

  describe('createJwt and verifyJwt', () => {
    const MOCK_PAYLOAD = {
      key: 'value',
    }

    const MOCK_EXPIRES_IN = '1h'
    it('should correctly create and verify a jwt', async () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      const jwtResult = await spOidcClient.createJWT(
        MOCK_PAYLOAD,
        MOCK_EXPIRES_IN,
      )
      const decodedJwt = await spOidcClient.verifyJwt(jwtResult)

      // Assert

      expect(decodedJwt).toMatchObject(MOCK_PAYLOAD)
    })
  })

  describe('getExtraTokenFields', () => {
    it('should return client_id object', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const spOidcClient = new SpOidcClient(spOidcClientConfig)

      // Act

      const extraFields = spOidcClient.getExtraTokenFields()

      // Assert
      expect(extraFields.client_id).toBe(spOidcClientConfig.rpClientId)
    })
  })
})

describe('CpOidcClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should correctly call the CpOidcClient constructor', () => {
      // Arrange
      const constructorSpy = jest
        .spyOn(SpcpOidcClientClass, 'CpOidcClient')
        .mockReturnValueOnce(undefined as unknown as CpOidcClient)

      // Act
      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      // Assert
      expect(cpOidcClient).toBeInstanceOf(CpOidcClient)
      expect(constructorSpy).toHaveBeenCalledOnce()
      expect(constructorSpy).toHaveBeenCalledWith(cpOidcClientConfig)
    })

    it('should correctly instantiate a SpcpOidcBaseClientCache', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cacheConstructorSpy = jest
        .spyOn(SpcpOidcBaseClientCacheClass, 'SpcpOidcBaseClientCache')
        .mockReturnValueOnce('ok' as unknown as SpcpOidcBaseClientCache)

      const expectedCacheConstructorParams = {
        ndiDiscoveryEndpoint: CP_OIDC_NDI_DISCOVERY_ENDPOINT,
        ndiJwksEndpoint: CP_OIDC_NDI_JWKS_ENDPOINT,
        rpClientId: CP_OIDC_RP_CLIENT_ID,
        rpRedirectUrl: CP_OIDC_RP_REDIRECT_URL,
        rpSecretJwks: TEST_CP_RP_SECRET_JWKS,
        options: {
          useClones: false,
          checkperiod: 60,
        },
      }

      // Act
      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      await Promise.resolve()

      // Assert
      expect(cpOidcClient).toBeInstanceOf(CpOidcClient)
      expect(cacheConstructorSpy).toHaveBeenCalledOnce()
      expect(cacheConstructorSpy).toHaveBeenCalledWith(
        expectedCacheConstructorParams,
      )
      expect(cpOidcClient._spcpOidcBaseClientCache).toBeInstanceOf(
        SpcpOidcBaseClientCache,
      )
    })

    it('should throw JwkError if `alg` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'alg'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'kty'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute is present on rp secret jwk but not set to EC', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...jwk,
            kty: 'something',
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `crv` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'crv'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `d` attribute not present on rp secret jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'd'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `alg` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'alg'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'kty'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `kty` attribute is present on rp public jwk but not set to EC', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...jwk,
            kty: 'something',
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })
    it('should throw JwkError if `crv` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.map((jwk) => ({
            ...omit(jwk, 'crv'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `x` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpPublicJwks: {
          keys: cpOidcClientConfig.rpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'x'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })

    it('should throw JwkError if `y` attribute not present on rp public jwk', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigIncorrect = {
        ...cpOidcClientConfig,
        rpPublicJwks: {
          keys: cpOidcClientConfig.rpPublicJwks.keys.map((jwk) => ({
            ...omit(jwk, 'y'),
          })),
        },
      }

      // Act
      const attemptConstructor = () => {
        new CpOidcClient(
          cpOidcClientConfigIncorrect as unknown as typeof cpOidcClientConfig,
        )
      }

      // Assert
      expect(attemptConstructor).toThrow(JwkError)
    })
  })

  describe('getNdiPublicKeysFromCache', () => {
    it('should correctly retrieve ndi public keys from cache and resolve if _spcpOidcBaseClientCache.getNdiPublicKeys resolves', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getNdiKeysSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getNdiPublicKeys')
        .mockResolvedValueOnce('ok' as unknown as CryptoKeys)

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result = await cpOidcClient.getNdiPublicKeysFromCache()

      // Assert

      expect(result).toBe('ok')
      expect(getNdiKeysSpy).toHaveBeenCalledOnce()
    })

    it('should reject if _spcpOidcBaseClientCache.getNdiPublicKeys rejects', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getNdiKeysSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getNdiPublicKeys')
        .mockRejectedValueOnce(new Error('Failure'))

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const keyResultPromise = cpOidcClient.getNdiPublicKeysFromCache()

      // Assert
      await expect(keyResultPromise).rejects.toThrow('Failure')
      expect(getNdiKeysSpy).toHaveBeenCalledOnce()
    })
  })

  describe('getBaseClientFromCache', () => {
    it('should correctly retrieve baseClient from cache and resolve if _spcpOidcBaseClientCache.getBaseClient resolves', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getBaseClientSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getBaseClient')
        .mockResolvedValueOnce('ok' as unknown as BaseClient)

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result = await cpOidcClient.getBaseClientFromCache()

      // Assert

      expect(result).toBe('ok')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })

    it('should reject if _spcpOidcBaseClientCache.getBaseClient rejects', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const getBaseClientSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'getBaseClient')
        .mockRejectedValueOnce(new Error('Failure'))

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const tryGetBaseClient = cpOidcClient.getBaseClientFromCache()

      // Assert
      await expect(tryGetBaseClient).rejects.toThrow('Failure')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })
  })

  describe('createAuthorisationUrl', () => {
    it('should throw CreateAuthorisationUrlError if state parameter is empty', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_STATE = ''
      const MOCK_ESRVCID = 'esrvcId'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const tryCreateUrl = cpOidcClient.createAuthorisationUrl(
        MOCK_EMPTY_STATE,
        MOCK_ESRVCID,
      )

      // Assert
      await expect(tryCreateUrl).rejects.toThrow(CreateAuthorisationUrlError)
      await expect(tryCreateUrl).rejects.toThrow('Empty state')
    })

    it('should throw CreateAuthorisationUrlError if esrvcId parameter is empty', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_EMPTY_ESRVCID = ''

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const tryCreateUrl = cpOidcClient.createAuthorisationUrl(
        MOCK_STATE,
        MOCK_EMPTY_ESRVCID,
      )

      // Assert
      await expect(tryCreateUrl).rejects.toThrow(CreateAuthorisationUrlError)
      await expect(tryCreateUrl).rejects.toThrow('Empty esrvcId')
    })

    it('should reject if getBaseClientFromCache rejects', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_ESRVCID = 'esrvcId'

      const getBaseClientSpy = jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockRejectedValueOnce(new Error('Failed'))

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const tryGetAuthorisationUrl = cpOidcClient.createAuthorisationUrl(
        MOCK_STATE,
        MOCK_ESRVCID,
      )

      // Assert
      await expect(tryGetAuthorisationUrl).rejects.toThrow('Failed')
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
    })

    it('should correctly call authorisationUrl with esrvcID for corppass and return the authorisation url generated by the base client', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_STATE = 'state'
      const MOCK_ESRVCID = 'esrvcId'
      const MOCK_URL = 'url'

      const mockAuthorisationUrlFn = jest.fn().mockReturnValue(MOCK_URL)

      const getBaseClientSpy = jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          authorizationUrl: mockAuthorisationUrlFn,
        } as unknown as BaseClient)

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = await cpOidcClient.createAuthorisationUrl(
        MOCK_STATE,
        MOCK_ESRVCID,
      )

      // Assert
      expect(getBaseClientSpy).toHaveBeenCalledOnce()
      expect(result).toBe(MOCK_URL)
      expect(mockAuthorisationUrlFn).toHaveBeenCalledOnce()
      expect(mockAuthorisationUrlFn).toHaveBeenCalledWith(
        expect.objectContaining({ esrvcID: MOCK_ESRVCID }),
      )
      expect(mockAuthorisationUrlFn).not.toHaveBeenCalledWith(
        expect.objectContaining({ esrvc: MOCK_ESRVCID }),
      )
    })
  })

  describe('getDecryptionKey', () => {
    it('should return GetDecryptionKeyError if jwe is empty', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_JWE = ''
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getDecryptionKey(MOCK_EMPTY_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetDecryptionKeyError)
      expect((result as GetDecryptionKeyError).message).toContain(
        'jwe is empty',
      )
    })

    it('should return GetDecryptionKeyError if `kid` does not exist on the jwe header', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWE = 'jwe'
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      jest.spyOn(jose, 'decodeProtectedHeader').mockReturnValueOnce({})

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getDecryptionKey(MOCK_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetDecryptionKeyError)
      expect((result as GetDecryptionKeyError).message).toContain(
        'no kid in idToken JWE',
      )
    })

    it('should return GetDecryptionKeyError if there is no matching `kid` in the keys', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getDecryptionKey(MOCK_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetDecryptionKeyError)
      expect((result as GetDecryptionKeyError).message).toContain(
        'no decryption key matches jwe kid',
      )
    })

    it('should return the first correct decryption key', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getDecryptionKey(MOCK_JWE, MOCK_KEYS)

      // Assert
      expect(result).toBe(MOCK_FIRST_KEY.key)
    })
  })

  describe('getVerificationKey', () => {
    it('should return GetVerificationKeyError if jws is empty', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_JWS = ''
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getVerificationKey(MOCK_EMPTY_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetVerificationKeyError)
      expect((result as GetVerificationKeyError).message).toContain(
        'jws is empty',
      )
    })

    it('should return GetVerificationKeyError if `kid` does not exist on the jws header', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_JWS = 'jws'
      const MOCK_KEYS = [{ kid: 'someKid' }] as unknown as CryptoKeys

      jest.spyOn(jose, 'decodeProtectedHeader').mockReturnValueOnce({})

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getVerificationKey(MOCK_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetVerificationKeyError)
      expect((result as GetVerificationKeyError).message).toContain(
        'no kid in JWS',
      )
    })

    it('should return GetVerificationKeyError if there is no matching `kid` in the keys', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getVerificationKey(MOCK_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBeInstanceOf(GetVerificationKeyError)
      expect((result as GetVerificationKeyError).message).toContain(
        'no verification key matches jws kid',
      )
    })

    it('should return the first correct verification key', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
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

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getVerificationKey(MOCK_JWS, MOCK_KEYS)

      // Assert
      expect(result).toBe(MOCK_FIRST_KEY.key)
    })
  })
  describe('exchangeAuthCodeAndDecodeVerifyToken', () => {
    const MOCK_SUB_CLAIM = 's=S1234567D'
    const createMockJws = async () => {
      const MOCK_JWS = await new jose.SignJWT({})
        .setSubject(MOCK_SUB_CLAIM)
        .setProtectedHeader({
          alg: 'ES512',
          kid: TEST_NDI_SECRET_JWKS.keys.find((key) => key.use === 'sig')?.kid,
        })
        .sign(
          createPrivateKey(
            jwkToPem(
              TEST_NDI_SECRET_JWKS.keys.find(
                (key) => key.use === 'sig',
              ) as unknown as jwkToPem.ECPrivate,
              { private: true },
            ),
          ),
        )
      return MOCK_JWS
    }

    const createMockJwe = async () => {
      const MOCK_JWS = await createMockJws()
      const MOCK_JWE = await new jose.CompactEncrypt(
        new TextEncoder().encode(MOCK_JWS),
      )
        .setProtectedHeader({
          alg: 'ECDH-ES+A256KW',
          enc: 'A256CBC-HS512',
          kid: TEST_CP_RP_PUBLIC_JWKS.keys.find((key) => key.use === 'enc')
            ?.kid,
        })
        .encrypt(
          createPublicKey(
            jwkToPem(
              TEST_CP_RP_PUBLIC_JWKS.keys.find(
                (key) => key.use === 'enc',
              ) as unknown as jwkToPem.EC,
            ),
          ),
        )

      return MOCK_JWE
    }

    const NDI_KEYS = TEST_NDI_PUBLIC_JWKS.keys.map((jwk) => {
      return {
        kid: jwk.kid,
        use: jwk.use,
        // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
        // TODO (#4021): load JWK directly after node upgrade
        key: createPublicKey(jwkToPem(jwk as jwkToPem.EC)),
      }
    })

    const AXIOS_HEADER = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }

    it('should throw ExchangeAuthTokenError if authCode is empty and NOT call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_EMPTY_AUTHCODE = ''

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_EMPTY_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(ExchangeAuthTokenError)
      await expect(tryExchangeAuthCode).rejects.toThrow('empty authCode')
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if failed to retrieve baseClient from cache and NOT call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockRejectedValueOnce(new Error('failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow('failed')
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if exchange at token endpoint fails and call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockRejectedValueOnce(new Error('failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow('failed')
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw a MissingIdTokenError if tokenSet does not contain idToken and call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: {} })

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(MissingIdTokenError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw a MissingIdTokenError if tokenSet contains empty idToken and call refresh', async () => {
      // Arrange
      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: '' } })

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(MissingIdTokenError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should return the correct payload containing the nric sub if idToken is valid', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(CpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockResolvedValueOnce(NDI_KEYS)

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result = await cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(
        MOCK_AUTHCODE,
      )

      // Assert
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(result.payload.sub).toBeDefined()
      expect(result.payload.sub).toBe(MOCK_SUB_CLAIM)
    })

    it('should throw a GetDecryptionKeyError if fails to obtain the correct decryption key and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)
      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })
      jest
        .spyOn(CpOidcClient.prototype, 'getDecryptionKey')
        .mockReturnValueOnce(new GetDecryptionKeyError())

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(GetDecryptionKeyError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw a GetDecryptionKeyError if decryption fails and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(CpOidcClient.prototype, 'getDecryptionKey')
        .mockReturnValueOnce(new GetDecryptionKeyError())

      jest
        .spyOn(jose, 'compactDecrypt')
        .mockRejectedValueOnce(new Error('decrypt failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(GetDecryptionKeyError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw an ExchangeAuthTokenError if fails to retrieve NDI public keys from cache and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(CpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockRejectedValueOnce('getNdiKeysfailed')

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow(ExchangeAuthTokenError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw an GetVerificationKeyError if fails to get verification key and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(CpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockResolvedValueOnce(NDI_KEYS)

      jest
        .spyOn(CpOidcClient.prototype, 'getVerificationKey')
        .mockReturnValueOnce(new GetVerificationKeyError())

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert

      await expect(tryExchangeAuthCode).rejects.toThrow(GetVerificationKeyError)
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw an error if fails to verify id token and call refresh', async () => {
      // Arrange

      const MOCK_JWE = await createMockJwe()

      const refreshSpy = jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getBaseClientFromCache')
        .mockResolvedValueOnce({
          issuer: {
            metadata: {
              token_endpoint: 'endpoint',
            },
          },
        } as unknown as BaseClient)

      const axiosSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { id_token: MOCK_JWE } })

      jest
        .spyOn(CpOidcClient.prototype, 'getNdiPublicKeysFromCache')
        .mockResolvedValueOnce(NDI_KEYS)

      jest
        .spyOn(jose, 'jwtVerify')
        .mockRejectedValueOnce(new Error('verify jwt failed'))

      const MOCK_AUTHCODE = 'authCode'

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const tryExchangeAuthCode =
        cpOidcClient.exchangeAuthCodeAndDecodeVerifyToken(MOCK_AUTHCODE)

      // Assert
      await expect(tryExchangeAuthCode).rejects.toThrow('verify jwt failed')
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledWith(
        'endpoint',
        expect.not.stringContaining('client_id'),
        expect.objectContaining(AXIOS_HEADER),
      )
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('extractNricOrForeignIdFromIdToken', () => {
    it('should return InvalidIdTokenError if sub attribute is missing in payload', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_IDTOKEN_MISSING_SUB = {
        payload: {
          something: 'else',
        },
      } as unknown as JWTVerifyResult

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result = cpOidcClient.extractNricOrForeignIdFromIdToken(
        MOCK_IDTOKEN_MISSING_SUB,
      )

      // Assert

      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should return InvalidIdTokenError if parseSub fails', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_IDTOKEN_MALFORMED_SUB = {
        payload: {
          sub: 's=S1234567D,,something=else',
        },
      } as unknown as JWTVerifyResult

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result = cpOidcClient.extractNricOrForeignIdFromIdToken(
        MOCK_IDTOKEN_MALFORMED_SUB,
      )

      // Assert

      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should return InvalidIdTokenError if sub does not contain nric', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const MOCK_IDTOKEN_NONRIC = {
        payload: {
          sub: 'something=else,another=other',
        },
      } as unknown as JWTVerifyResult

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result =
        cpOidcClient.extractNricOrForeignIdFromIdToken(MOCK_IDTOKEN_NONRIC)

      // Assert

      expect(result).toBeInstanceOf(InvalidIdTokenError)
    })

    it('should correctly return the first NRIC from sub when sub contains multiple key value pairs', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const FIRST_NRIC = 'S1234567D'
      const MOCK_SUB_MULTIPLE = `s=${FIRST_NRIC},otherKey=otherValue,s=S9876543C`

      const MOCK_ID_TOKEN = {
        payload: { sub: MOCK_SUB_MULTIPLE },
      } as unknown as JWTVerifyResult

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result =
        cpOidcClient.extractNricOrForeignIdFromIdToken(MOCK_ID_TOKEN)

      // Assert

      expect(result).toBe(FIRST_NRIC)
    })

    it('should correctly return the NRIC from sub when sub contains only one key value pair', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const FIRST_NRIC = 'S1234567D'
      const MOCK_SUB_MULTIPLE = `s=${FIRST_NRIC}`

      const MOCK_ID_TOKEN = {
        payload: { sub: MOCK_SUB_MULTIPLE },
      } as unknown as JWTVerifyResult

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const result =
        cpOidcClient.extractNricOrForeignIdFromIdToken(MOCK_ID_TOKEN)

      // Assert

      expect(result).toBe(FIRST_NRIC)
    })
  })

  describe('getSigningKey', () => {
    it('should return the first correct signing key', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const correctKid = TEST_CP_RP_SECRET_JWKS.keys.filter(
        (key) => key.use === 'sig',
      )[0].kid

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result = cpOidcClient.getSigningKey()

      // Assert
      expect((result as SigningKey).kid).toBe(correctKid)
    })

    it('should return GetSigningKeyError if no signing keys are found', () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigWithoutSigningKeys = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.filter(
            (key) => key.use !== 'sig',
          ),
        },
      }

      // Act

      const cpOidcClient = new CpOidcClient(
        cpOidcClientConfigWithoutSigningKeys,
      )
      const result = cpOidcClient.getSigningKey()

      // Assert
      expect(result).toBeInstanceOf(GetSigningKeyError)
      expect((result as GetSigningKeyError).message).toContain(
        'No signing keys found',
      )
    })
  })

  describe('createJWT', () => {
    const MOCK_PAYLOAD = {
      key: 'value',
    }

    const MOCK_EXPIRES_IN = 2000

    it('should throw CreateJwtError if no signing keys found', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClientConfigWithoutSigningKeys = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.filter(
            (key) => key.use !== 'sig',
          ),
        },
      }

      // Act

      const cpOidcClient = new CpOidcClient(
        cpOidcClientConfigWithoutSigningKeys,
      )

      const tryCreateJWT = cpOidcClient.createJWT(MOCK_PAYLOAD, MOCK_EXPIRES_IN)

      // Assert

      await expect(tryCreateJWT).rejects.toThrow(CreateJwtError)
      await expect(tryCreateJWT).rejects.toThrow('no signing key found')
    })
  })

  describe('verifyJwt', () => {
    const MOCK_JWT = 'jwt'

    it('should throw VerificationKeyError if no verification key found', async () => {
      // Arrange
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      jest
        .spyOn(CpOidcClient.prototype, 'getVerificationKey')
        .mockReturnValueOnce(new GetVerificationKeyError())

      const cpOidcClientConfigWithoutVerificationKeys = {
        ...cpOidcClientConfig,
        rpSecretJwks: {
          keys: cpOidcClientConfig.rpSecretJwks.keys.filter(
            (key) => key.use !== 'sig',
          ),
        },
      }

      // Act

      const cpOidcClient = new CpOidcClient(
        cpOidcClientConfigWithoutVerificationKeys,
      )

      const tryVerifyJwt = cpOidcClient.verifyJwt(MOCK_JWT)

      // Assert

      await expect(tryVerifyJwt).rejects.toThrow(VerificationKeyError)
      await expect(tryVerifyJwt).rejects.toThrow('no verification key found')
    })
  })

  describe('createJwt and verifyJwt', () => {
    it('should correctly create and verify a jwt', async () => {
      // Arrange
      const MOCK_PAYLOAD = {
        key: 'value',
      }

      const MOCK_EXPIRES_IN = '1h'
      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      const jwtResult = await cpOidcClient.createJWT(
        MOCK_PAYLOAD,
        MOCK_EXPIRES_IN,
      )
      const decodedJwt = await cpOidcClient.verifyJwt(jwtResult)

      // Assert

      expect(decodedJwt).toMatchObject(MOCK_PAYLOAD)
    })
  })

  describe('extractCPEntityIdFromIdToken', () => {
    it('should return InvalidIdTokenError if idToken is missing entityInfo', () => {
      // Arrange
      const EMPTY_UEN_ID_TOKEN = {
        payload: {
          something: {
            CPEntID: 'A1234567A',
          },
        },
      } as unknown as CPJWTVerifyResult

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result =
        cpOidcClient.extractCPEntityIdFromIdToken(EMPTY_UEN_ID_TOKEN)

      // Assert

      expect(result).toBeInstanceOf(InvalidIdTokenError)
      expect((result as InvalidIdTokenError).message).toContain(
        'idToken has incorrect shape',
      )
    }),
      it('should return InvalidIdTokenError if idToken is missing CPEntID', () => {
        // Arrange
        const EMPTY_UEN_ID_TOKEN = {
          payload: {
            entityInfo: {
              something: 'A1234567A',
            },
          },
        } as unknown as CPJWTVerifyResult

        jest
          .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        // Act

        const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
        const result =
          cpOidcClient.extractCPEntityIdFromIdToken(EMPTY_UEN_ID_TOKEN)

        // Assert

        expect(result).toBeInstanceOf(InvalidIdTokenError)
        expect((result as InvalidIdTokenError).message).toContain(
          'idToken has incorrect shape',
        )
      }),
      it('should return InvalidIdTokenError if CPEntID is empty string', () => {
        // Arrange
        const EMPTY_UEN_ID_TOKEN = {
          payload: {
            entityInfo: {
              CPEntID: '',
            },
          },
        } as unknown as CPJWTVerifyResult

        jest
          .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
          .mockResolvedValueOnce('ok' as unknown as Refresh)

        // Act

        const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
        const result =
          cpOidcClient.extractCPEntityIdFromIdToken(EMPTY_UEN_ID_TOKEN)

        // Assert

        expect(result).toBeInstanceOf(InvalidIdTokenError)
        expect((result as InvalidIdTokenError).message).toContain(
          'CPEntID attribute is empty string',
        )
      })

    it('should extract CPEntID from CP ID Token and return correctly', () => {
      // Arrange
      const CORRECT_ENT_ID = 'A123456789K'
      const CORRECT_UEN_ID_TOKEN = {
        payload: {
          entityInfo: {
            CPEntID: CORRECT_ENT_ID,
          },
        },
      } as unknown as CPJWTVerifyResult

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      // Act

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)
      const result =
        cpOidcClient.extractCPEntityIdFromIdToken(CORRECT_UEN_ID_TOKEN)

      // Assert

      expect(result).toBe(CORRECT_ENT_ID)
    })
  })

  describe('getExtraTokenFields', () => {
    it('should return empty object', () => {
      // Arrange

      jest
        .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
        .mockResolvedValueOnce('ok' as unknown as Refresh)

      const cpOidcClient = new CpOidcClient(cpOidcClientConfig)

      // Act

      const extraFields = cpOidcClient.getExtraTokenFields()

      // Assert
      expect(extraFields).toEqual({})
    })
  })
})
