import { JWTVerifyResult } from 'jose'
import { omit } from 'lodash'

import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { cpOidcClientConfig } from '../../__tests__/spcp.oidc.test.constants'
import {
  MOCK_COOKIES,
  MOCK_CP_JWT_PAYLOAD,
  MOCK_CP_OIDC_AUTHORISATION_CODE,
  MOCK_DECODED_QUERY,
  MOCK_ENCODED_QUERY,
  MOCK_ESRVCID,
  MOCK_JWT,
  MOCK_JWT_PAYLOAD,
  MOCK_REDIRECT_URL,
  MOCK_SERVICE_PARAMS as MOCK_PARAMS,
  MOCK_TARGET,
} from '../../__tests__/spcp.test.constants'
import {
  CreateJwtError,
  CreateRedirectUrlError,
  ExchangeAuthTokenError,
  InvalidJwtError,
  InvalidStateError,
  MissingAttributesError,
  MissingJwtError,
  VerifyJwtError,
} from '../../spcp.errors'
import { CpOidcClient } from '../../spcp.oidc.client'
import { SpcpOidcBaseClientCache } from '../../spcp.oidc.client.cache'
import { Refresh } from '../../spcp.oidc.client.types'
import { ExtractedCorppassNDIPayload, JwtName } from '../../spcp.types'
import * as SpcpUtils from '../../spcp.util'
import { CpOidcServiceClass } from '../spcp.oidc.service.cp'
import { CpOidcProps } from '../spcp.oidc.service.types'

jest.mock('../../spcp.oidc.client')

jest.mock('axios')

describe('spcp.oidc.service', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    jest
      .spyOn(SpcpOidcBaseClientCache.prototype, 'refresh')
      .mockResolvedValue('ok' as unknown as Refresh)
  })
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  const MOCK_PARAMS_CP = {
    ...MOCK_PARAMS,
    cookieMaxAge: MOCK_PARAMS.cpCookieMaxAge,
    cookieDomain: MOCK_PARAMS.spcpCookieDomain,
  }

  const mockCpOidcClient = new CpOidcClient(cpOidcClientConfig)

  describe('getClient', () => {
    it('should correctly return cp oidc client', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      // Act

      const client = cpOidcServiceClass.getClient()

      // Assert

      expect(client).toBeInstanceOf(CpOidcClient)
    })
  })

  describe('createRedirectUrl', () => {
    it('should call cp oidc client createRedirectUrl with the correct params and return the redirectUrl if it resolves', async () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest
        .spyOn(mockCpOidcClient, 'createAuthorisationUrl')
        .mockResolvedValueOnce(MOCK_REDIRECT_URL)

      // Act

      const redirectUrl = await cpOidcServiceClass.createRedirectUrl(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      // Assert
      expect(mockCpOidcClient.createAuthorisationUrl).toHaveBeenCalledTimes(1)
      expect(mockCpOidcClient.createAuthorisationUrl).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should return CreateRedirectUrlError if cp oidc client returns error', async () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      jest
        .spyOn(mockCpOidcClient, 'createAuthorisationUrl')
        .mockRejectedValueOnce(new Error())

      // Act

      const redirectUrl = await cpOidcServiceClass.createRedirectUrl(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      // Assert
      expect(mockCpOidcClient.createAuthorisationUrl).toHaveBeenCalledTimes(1)
      expect(mockCpOidcClient.createAuthorisationUrl).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      expect(redirectUrl._unsafeUnwrapErr()).toBeInstanceOf(
        CreateRedirectUrlError,
      )
    })
  })

  describe('extractJwt', () => {
    it('should return Corppass JWT correctly', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      // Act
      const result = cpOidcServiceClass.extractJwt(MOCK_COOKIES)

      // Assert

      expect(result._unsafeUnwrap()).toEqual(MOCK_COOKIES[JwtName.CP])
    })

    it('should return MissingJwtError if there is no JWT', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      // Act
      const result = cpOidcServiceClass.extractJwt({})

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(new MissingJwtError())
    })

    it('should return MissingJwtError if there is no JWT for CP', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const MOCK_COOKIES_SP_ONLY = {
        [JwtName.SP]: 'mockSpJwt',
      }

      // Act
      const result = cpOidcServiceClass.extractJwt(MOCK_COOKIES_SP_ONLY)

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(new MissingJwtError())
    })
  })

  describe('extractJwtPayload', () => {
    it('should return the correct payload for Corppass when JWT is valid', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      jest
        .spyOn(mockCpOidcClient, 'verifyJwt')
        .mockResolvedValueOnce(MOCK_CP_JWT_PAYLOAD)

      // Act
      const result = await cpOidcServiceClass.extractJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_CP_JWT_PAYLOAD)
    })

    // TODO(#4496): Remove backward compatible code to allow jwt signed with saml keys
    it('should return the correct payload for Corppass when a valid JWT is present signed with SAML keys', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      jest
        .spyOn(mockCpOidcClient, 'verifyJwt')
        .mockRejectedValueOnce(new Error())

      jest
        .spyOn(SpcpUtils, 'verifyJwtPromise')
        .mockResolvedValueOnce(MOCK_CP_JWT_PAYLOAD)

      // Act
      const result = await cpOidcServiceClass.extractJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_CP_JWT_PAYLOAD)
    })

    it('should return VerifyJwtError when Corppass JWT could not be verified', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest
        .spyOn(mockCpOidcClient, 'verifyJwt')
        .mockRejectedValueOnce(new Error())

      // Act
      const result = await cpOidcServiceClass.extractJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(VerifyJwtError)
    })

    it('should return InvalidJwtError when CP JWT has invalid shape', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest.spyOn(mockCpOidcClient, 'verifyJwt').mockResolvedValueOnce({})

      // Act
      const result = await cpOidcServiceClass.extractJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
    })
  })

  describe('extractJwtPayloadFromRequest', () => {
    it('should return a CP JWT payload when there is a valid JWT in the request', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest
        .spyOn(mockCpOidcClient, 'verifyJwt')
        .mockResolvedValueOnce(MOCK_CP_JWT_PAYLOAD)

      // Act
      const result = await cpOidcServiceClass.extractJwtPayloadFromRequest(
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_CP_JWT_PAYLOAD)
    })

    it('should return MissingJwtError if there is no JWT when client authenticates using CP', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      // Act
      const result = await cpOidcServiceClass.extractJwtPayloadFromRequest({})

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingJwtError)
    })

    it('should return InvalidJwtError when the client authenticates using CP and the JWT has wrong shape', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest.spyOn(mockCpOidcClient, 'verifyJwt').mockResolvedValueOnce({})

      // Act
      const result = await cpOidcServiceClass.extractJwtPayloadFromRequest(
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
    })
  })

  describe('parseState for CP forms', () => {
    it('should parse CP params correctly when rememberMe is true', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/${MOCK_TARGET}-true`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })
    it('should parse CP params correctly when rememberMe is false', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/${MOCK_TARGET}-false`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should parse CP params correctly when rememberMe is malformed', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/${MOCK_TARGET}-something`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should parse CP params correctly when target has trailing slash', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/${MOCK_TARGET}/-true`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}/`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should parse CP params correctly when there is encodedQuery payload', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/${MOCK_TARGET}-true-${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}${MOCK_DECODED_QUERY}`,

        rememberMe: true,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should return InvalidStateError when state is malformed with no hyphen', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/${MOCK_TARGET}/true${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })

    it('should return InvalidStateError when state is malformed with more than 2 hyphen', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/${MOCK_TARGET}/---true${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })

    it('should return InvalidStateError when CP formId is malformed', () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const mockState = `/*-true`

      // Act
      const parsedResult = cpOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })
  })

  describe('exchangeAuthCodeAndRetrieveData', () => {
    it('should call cp oidc client correctly and return the result', async () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      const MOCK_NRIC = 'S1234567D'
      const MOCK_UEN = 'A123456789X'

      jest
        .spyOn(mockCpOidcClient, 'exchangeAuthCodeAndDecodeVerifyToken')
        .mockResolvedValueOnce({
          payload: { sub: `s=${MOCK_NRIC}`, entityInfo: { CPEntID: MOCK_UEN } },
        } as unknown as JWTVerifyResult)

      jest
        .spyOn(mockCpOidcClient, 'extractNricOrForeignIdFromIdToken')
        .mockReturnValueOnce(MOCK_NRIC)
      jest
        .spyOn(mockCpOidcClient, 'extractCPEntityIdFromIdToken')
        .mockReturnValueOnce(MOCK_UEN)

      const expectedCPPayload = {
        userInfo: MOCK_NRIC,
        userName: MOCK_UEN,
      }

      // Act
      const result = await cpOidcServiceClass.exchangeAuthCodeAndRetrieveData(
        MOCK_CP_OIDC_AUTHORISATION_CODE,
      )

      // Assert
      expect(
        mockCpOidcClient.exchangeAuthCodeAndDecodeVerifyToken,
      ).toHaveBeenCalledWith(MOCK_CP_OIDC_AUTHORISATION_CODE)
      expect(result._unsafeUnwrap()).toEqual(expectedCPPayload)
    })

    it('should should return ExchangeAuthTokenError if client errors', async () => {
      // Arrange

      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest
        .spyOn(mockCpOidcClient, 'exchangeAuthCodeAndDecodeVerifyToken')
        .mockRejectedValueOnce(new Error())

      // Act
      const result = await cpOidcServiceClass.exchangeAuthCodeAndRetrieveData(
        MOCK_CP_OIDC_AUTHORISATION_CODE,
      )

      // Assert
      expect(
        mockCpOidcClient.exchangeAuthCodeAndDecodeVerifyToken,
      ).toHaveBeenCalledWith(MOCK_CP_OIDC_AUTHORISATION_CODE)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ExchangeAuthTokenError)
    })
  })

  describe('createJWT', () => {
    it('should call cp oidc client with the correct params', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest.spyOn(mockCpOidcClient, 'createJWT').mockResolvedValueOnce(MOCK_JWT)

      // Act
      const jwtResult = await cpOidcServiceClass.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
      )

      // Assert
      expect(mockCpOidcClient.createJWT).toHaveBeenCalledWith(
        MOCK_JWT_PAYLOAD,
        `${MOCK_COOKIE_AGE / 1000}s`,
      )
      expect(jwtResult._unsafeUnwrap()).toEqual(MOCK_JWT)
    })

    it('should return CreateJwtError if cp oidc client errors', async () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      jest
        .spyOn(mockCpOidcClient, 'createJWT')
        .mockRejectedValueOnce(new Error())

      // Act
      const jwtResult = await cpOidcServiceClass.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
      )

      // Assert
      expect(jwtResult._unsafeUnwrapErr()).toBeInstanceOf(CreateJwtError)
    })
  })

  describe('createJWTPayload', () => {
    it('should correctly return payload', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const MOCK_NRIC = 'S1234567A'
      const MOCK_UEN = 'A123456789Z'
      const MOCK_ATTRIBUTES = {
        userInfo: MOCK_NRIC,
        userName: MOCK_UEN,
      }
      const expectedPayload = {
        ...MOCK_ATTRIBUTES,
        rememberMe: true,
      }

      // Act
      const jwtPayloadResult = cpOidcServiceClass.createJWTPayload(
        MOCK_ATTRIBUTES,
        true,
      )

      // Assert
      expect(jwtPayloadResult._unsafeUnwrap()).toMatchObject(expectedPayload)
    })

    it('should return MissingAttributesError if nric is empty string string', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const MOCK_NRIC = ''
      const MOCK_UEN = 'A123456789Z'
      const MOCK_ATTRIBUTES = {
        userInfo: MOCK_NRIC,
        userName: MOCK_UEN,
      }

      // Act
      const jwtPayloadResult = cpOidcServiceClass.createJWTPayload(
        MOCK_ATTRIBUTES,
        true,
      )

      // Assert
      expect(jwtPayloadResult._unsafeUnwrapErr()).toBeInstanceOf(
        MissingAttributesError,
      )
    })

    it('should return MissingAttributesError if uen is empty string string', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const MOCK_NRIC = 'S1234567A'
      const MOCK_UEN = ''
      const MOCK_ATTRIBUTES = {
        userInfo: MOCK_NRIC,
        userName: MOCK_UEN,
      }

      // Act
      const jwtPayloadResult = cpOidcServiceClass.createJWTPayload(
        MOCK_ATTRIBUTES,
        true,
      )

      // Assert
      expect(jwtPayloadResult._unsafeUnwrapErr()).toBeInstanceOf(
        MissingAttributesError,
      )
    })

    it('should return MissingAttributesError if userInfo property is missing from attributes', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const MOCK_UEN = 'A123456789Z'
      const MOCK_ATTRIBUTES = {
        userName: MOCK_UEN,
      } as unknown as ExtractedCorppassNDIPayload

      // Act
      const jwtPayloadResult = cpOidcServiceClass.createJWTPayload(
        MOCK_ATTRIBUTES,
        true,
      )

      // Assert
      expect(jwtPayloadResult._unsafeUnwrapErr()).toBeInstanceOf(
        MissingAttributesError,
      )
    })

    it('should return MissingAttributesError if userName property is missing from attributes', () => {
      // Arrange
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )
      const MOCK_NRIC = 'S1234567A'
      const MOCK_ATTRIBUTES = {
        userInfo: MOCK_NRIC,
      } as unknown as ExtractedCorppassNDIPayload

      // Act
      const jwtPayloadResult = cpOidcServiceClass.createJWTPayload(
        MOCK_ATTRIBUTES,
        true,
      )

      // Assert
      expect(jwtPayloadResult._unsafeUnwrapErr()).toBeInstanceOf(
        MissingAttributesError,
      )
    })
  })
  describe('getCookieSettings', () => {
    it('should return the correct cookie settings if cookieDomain is truthy', () => {
      // Act
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        MOCK_PARAMS_CP,
      )

      // Assert
      expect(cpOidcServiceClass.getCookieSettings()).toEqual({
        domain: MOCK_PARAMS_CP.spcpCookieDomain,
        path: '/',
      })
    })

    it('should return empty object if cookieDomain is falsy', () => {
      // Act
      const cpOidcServiceClass = new CpOidcServiceClass(
        mockCpOidcClient,
        omit(MOCK_PARAMS_CP, 'cookieDomain') as unknown as CpOidcProps,
      )

      // Assert
      expect(cpOidcServiceClass.getCookieSettings()).toEqual({})
    })
  })
})
