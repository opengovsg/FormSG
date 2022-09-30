import { JWTVerifyResult } from 'jose'
import { omit } from 'lodash'

import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { spOidcClientConfig } from '../../__tests__/spcp.oidc.test.constants'
import {
  MOCK_COOKIES,
  MOCK_DECODED_QUERY,
  MOCK_ENCODED_QUERY,
  MOCK_ESRVCID,
  MOCK_JWT,
  MOCK_JWT_PAYLOAD,
  MOCK_REDIRECT_URL,
  MOCK_SERVICE_PARAMS as MOCK_PARAMS,
  MOCK_SP_JWT_PAYLOAD,
  MOCK_SP_OIDC_AUTHORISATION_CODE,
  MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD,
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
import { SpOidcClient } from '../../spcp.oidc.client'
import { SpcpOidcBaseClientCache } from '../../spcp.oidc.client.cache'
import { Refresh } from '../../spcp.oidc.client.types'
import { JwtName } from '../../spcp.types'
import { SpOidcServiceClass } from '../spcp.oidc.service.sp'
import { SpOidcProps } from '../spcp.oidc.service.types'

jest.mock('../../spcp.oidc.client')

jest.mock('axios')

describe('spcp.oidc.service.sp', () => {
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

  const MOCK_PARAMS_SP = {
    ...MOCK_PARAMS,
    cookieMaxAge: MOCK_PARAMS.spCookieMaxAge,
    cookieMaxAgePreserved: MOCK_PARAMS.spCookieMaxAgePreserved,
    cookieDomain: MOCK_PARAMS.spcpCookieDomain,
  }

  const mockSpOidcClient = new SpOidcClient(spOidcClientConfig)
  describe('getClient', () => {
    it('should correctly return sp oidc client', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      // Act

      const client = spOidcServiceClass.getClient()

      // Assert

      expect(client).toBeInstanceOf(SpOidcClient)
    })
  })

  describe('createRedirectUrl', () => {
    it('should call sp oidc client createRedirectUrl with the correct params and return the redirectUrl if it resolves', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      jest
        .spyOn(mockSpOidcClient, 'createAuthorisationUrl')
        .mockResolvedValueOnce(MOCK_REDIRECT_URL)

      // Act

      const redirectUrl = await spOidcServiceClass.createRedirectUrl(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      // Assert
      expect(mockSpOidcClient.createAuthorisationUrl).toHaveBeenCalledTimes(1)
      expect(mockSpOidcClient.createAuthorisationUrl).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should return CreateRedirectUrlError if sp oidc client returns error', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      jest
        .spyOn(mockSpOidcClient, 'createAuthorisationUrl')
        .mockRejectedValueOnce(new Error())

      // Act

      const redirectUrl = await spOidcServiceClass.createRedirectUrl(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      // Assert
      expect(mockSpOidcClient.createAuthorisationUrl).toHaveBeenCalledTimes(1)
      expect(mockSpOidcClient.createAuthorisationUrl).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      expect(redirectUrl._unsafeUnwrapErr()).toBeInstanceOf(
        CreateRedirectUrlError,
      )
    })
  })

  describe('extractJwt', () => {
    it('should return SingPass JWT correctly', () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      // Act
      const result = spOidcServiceClass.extractJwt(MOCK_COOKIES)

      // Assert

      expect(result._unsafeUnwrap()).toEqual(MOCK_COOKIES[JwtName.SP])
    })

    it('should return MissingJwtError if there is no JWT', () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      // Act
      const result = spOidcServiceClass.extractJwt({})

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(new MissingJwtError())
    })

    it('should return MissingJwtError if there is no JWT for SP', () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const MOCK_COOKIES_CP_ONLY = {
        [JwtName.CP]: 'mockCpJwt',
      }

      // Act
      const result = spOidcServiceClass.extractJwt(MOCK_COOKIES_CP_ONLY)

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(new MissingJwtError())
    })
  })

  describe('extractJwtPayload', () => {
    it('should return the correct payload for Singpass when JWT is valid', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      mockSpOidcClient.verifyJwt = jest
        .fn()
        .mockResolvedValueOnce(MOCK_SP_JWT_PAYLOAD)

      // Act
      const result = await spOidcServiceClass.extractJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_SP_JWT_PAYLOAD)
    })

    it('should return VerifyJwtError when SingPass JWT could not be verified', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      jest
        .spyOn(mockSpOidcClient, 'verifyJwt')
        .mockRejectedValueOnce(new Error())

      // Act
      const result = await spOidcServiceClass.extractJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(VerifyJwtError)
    })

    it('should return InvalidJwtError when SP JWT has invalid shape', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      jest.spyOn(mockSpOidcClient, 'verifyJwt').mockResolvedValueOnce({})

      // Act
      const result = await spOidcServiceClass.extractJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
    })
  })

  describe('extractJwtPayloadFromRequest', () => {
    it('should return a SP JWT payload when there is a valid JWT in the request', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      mockSpOidcClient.verifyJwt = jest
        .fn()
        .mockResolvedValueOnce(MOCK_SP_JWT_PAYLOAD)

      // Act
      const result = await spOidcServiceClass.extractJwtPayloadFromRequest(
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_SP_JWT_PAYLOAD)
    })

    it('should return MissingJwtError if there is no JWT when client authenticates using SP', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      // Act
      const result = await spOidcServiceClass.extractJwtPayloadFromRequest({})

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingJwtError)
    })

    it('should return InvalidJwtError when the client authenticates using SP and the JWT has wrong shape', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      jest.spyOn(mockSpOidcClient, 'verifyJwt').mockResolvedValueOnce({})

      // Act
      const result = await spOidcServiceClass.extractJwtPayloadFromRequest(
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
    })
  })

  describe('parseState', () => {
    it('should parse SP params correctly when rememberMe is true', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/${MOCK_TARGET}-true`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
      })
    })
    it('should parse SP params correctly when rememberMe is false', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/${MOCK_TARGET}-false`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.spCookieMaxAge,
      })
    })

    it('should parse SP params correctly when rememberMe is malformed', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/${MOCK_TARGET}-something`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.spCookieMaxAge,
      })
    })

    it('should parse SP params correctly when target has trailing slash', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/${MOCK_TARGET}/-true`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}/`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
      })
    })

    it('should parse SP params correctly when there is encodedQuery payload', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/${MOCK_TARGET}-true-${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}${MOCK_DECODED_QUERY}`,

        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
      })
    })

    it('should return InvalidStateError when state is malformed with no hyphen', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/${MOCK_TARGET}/true${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })

    it('should return InvalidStateError when state is malformed with more than 2 hyphen', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/${MOCK_TARGET}/---true${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })

    it('should return InvalidStateError when SP formId is malformed', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const mockState = `/*-true`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })
  })

  describe('exchangeAuthCodeAndRetrieveData', () => {
    it('should call sp oidc client correctly and return the result', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      const MOCK_NRIC = 'S1234567D'

      mockSpOidcClient.exchangeAuthCodeAndDecodeVerifyToken = jest
        .fn()
        .mockResolvedValueOnce({
          payload: { sub: `s=${MOCK_NRIC}` },
        } as unknown as JWTVerifyResult)

      mockSpOidcClient.extractNricOrForeignIdFromIdToken = jest
        .fn()
        .mockReturnValueOnce(MOCK_NRIC)

      // Act
      const result = await spOidcServiceClass.exchangeAuthCodeAndRetrieveData(
        MOCK_SP_OIDC_AUTHORISATION_CODE,
      )

      // Assert
      expect(
        mockSpOidcClient.exchangeAuthCodeAndDecodeVerifyToken,
      ).toHaveBeenCalledWith(MOCK_SP_OIDC_AUTHORISATION_CODE)
      expect(result._unsafeUnwrap()).toEqual({ userName: MOCK_NRIC })
    })

    it('should should return ExchangeAuthTokenError if client errors', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      mockSpOidcClient.exchangeAuthCodeAndDecodeVerifyToken = jest
        .fn()
        .mockRejectedValueOnce(new Error())

      // Act
      const result = await spOidcServiceClass.exchangeAuthCodeAndRetrieveData(
        MOCK_SP_OIDC_AUTHORISATION_CODE,
      )

      // Assert
      expect(
        mockSpOidcClient.exchangeAuthCodeAndDecodeVerifyToken,
      ).toHaveBeenCalledWith(MOCK_SP_OIDC_AUTHORISATION_CODE)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ExchangeAuthTokenError)
    })
  })

  describe('createJWT', () => {
    it('should call sp oidc client with the correct params', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      jest.spyOn(mockSpOidcClient, 'createJWT').mockResolvedValueOnce(MOCK_JWT)

      // Act
      const jwtResult = await spOidcServiceClass.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
      )

      // Assert
      expect(mockSpOidcClient.createJWT).toHaveBeenCalledWith(
        MOCK_JWT_PAYLOAD,
        `${MOCK_COOKIE_AGE / 1000}s`,
      )
      expect(jwtResult._unsafeUnwrap()).toEqual(MOCK_JWT)
    })

    it('should return CreateJwtError if sp oidc client errors', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      mockSpOidcClient.createJWT = jest.fn().mockRejectedValueOnce(new Error())

      // Act
      const jwtResult = await spOidcServiceClass.createJWT(
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
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const MOCK_NRIC = 'S1234567C'
      const expectedPayload = {
        userName: MOCK_NRIC,
        rememberMe: true,
      }

      // Act
      const jwtPayloadResult = spOidcServiceClass.createJWTPayload(
        MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD,
        true,
      )

      // Assert
      expect(jwtPayloadResult._unsafeUnwrap()).toMatchObject(expectedPayload)
    })

    it('should return MissingAttributesError if attribute is empty string string', () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )
      const MOCK_NRIC = ''

      // Act
      const jwtPayloadResult = spOidcServiceClass.createJWTPayload(
        { userName: MOCK_NRIC },
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
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        MOCK_PARAMS_SP,
      )

      // Assert
      expect(spOidcServiceClass.getCookieSettings()).toEqual({
        domain: MOCK_PARAMS.spcpCookieDomain,
        path: '/',
      })
    })

    it('should return empty object if cookieDomain is falsy', () => {
      // Act
      const spOidcServiceClass = new SpOidcServiceClass(
        mockSpOidcClient,
        omit(MOCK_PARAMS_SP, 'cookieDomain') as unknown as SpOidcProps,
      )

      // Assert
      expect(spOidcServiceClass.getCookieSettings()).toEqual({})
    })
  })
})
