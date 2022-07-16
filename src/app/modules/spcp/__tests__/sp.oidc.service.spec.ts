import fs from 'fs'
import { JWTVerifyResult } from 'jose'
import { omit } from 'lodash'
import { mocked } from 'ts-jest/utils'

import { ISpcpMyInfo } from 'src/app/config/features/spcp-myinfo.config'
import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { SpOidcClient } from '../sp.oidc.client'
import { SpOidcServiceClass } from '../sp.oidc.service'
import {
  CreateJwtError,
  CreateRedirectUrlError,
  ExchangeAuthTokenError,
  InvalidJwtError,
  InvalidStateError,
  MissingJwtError,
  VerifyJwtError,
} from '../spcp.errors'
import { JwtName } from '../spcp.types'

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
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('../sp.oidc.client')
const MockSpOidcClient = mocked(SpOidcClient, true)

jest.mock('axios')

describe('sp.oidc.service', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())
  describe('class constructor', () => {
    it('should instantiate sp oidc client with the correct params', () => {
      // Arrange
      // Act
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      // Assert
      expect(spOidcServiceClass).toBeTruthy()
      expect(MockSpOidcClient).toHaveBeenCalledOnce()
      expect(MockSpOidcClient).toBeCalledWith({
        spOidcRpClientId: MOCK_PARAMS.spOidcRpClientId,
        spOidcRpRedirectUrl: MOCK_PARAMS.spOidcRpRedirectUrl,
        spOidcNdiDiscoveryEndpoint: MOCK_PARAMS.spOidcNdiDiscoveryEndpoint,
        spOidcNdiJwksEndpoint: MOCK_PARAMS.spOidcNdiJwksEndpoint,
        spOidcRpSecretJwks: expect.objectContaining(
          JSON.parse(
            fs.readFileSync(MOCK_PARAMS.spOidcRpJwksSecretPath).toString(),
          ),
        ),
        spOidcRpPublicJwks: expect.objectContaining(
          JSON.parse(
            fs.readFileSync(MOCK_PARAMS.spOidcRpJwksPublicPath).toString(),
          ),
        ),
      })
    })
  })

  describe('createRedirectUrl', () => {
    it('should call sp oidc client createRedirectUrl with the correct params and return the redirectUrl if it resolves', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      mockClient.createAuthorisationUrl.mockResolvedValueOnce(MOCK_REDIRECT_URL)

      // Act

      const redirectUrl = await spOidcServiceClass.createRedirectUrl(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      // Assert
      expect(mockClient.createAuthorisationUrl).toHaveBeenCalledTimes(1)
      expect(mockClient.createAuthorisationUrl).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should return CreateRedirectUrlError if sp oidc client returns error', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      mockClient.createAuthorisationUrl.mockRejectedValueOnce(new Error())

      // Act

      const redirectUrl = await spOidcServiceClass.createRedirectUrl(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )

      // Assert
      expect(mockClient.createAuthorisationUrl).toHaveBeenCalledTimes(1)
      expect(mockClient.createAuthorisationUrl).toHaveBeenCalledWith(
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
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      // Act
      const result = spOidcServiceClass.extractJwt(MOCK_COOKIES)

      // Assert

      expect(result._unsafeUnwrap()).toEqual(MOCK_COOKIES[JwtName.SP])
    })

    it('should return MissingJwtError if there is no JWT', () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      // Act
      const result = spOidcServiceClass.extractJwt({})

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(new MissingJwtError())
    })
  })

  describe('extractSingpassJwtPayload', () => {
    it('should return the correct payload for Singpass when JWT is valid', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      mockClient.verifyJwt.mockResolvedValueOnce(MOCK_SP_JWT_PAYLOAD)

      // Act
      const result = await spOidcServiceClass.extractSingpassJwtPayload(
        MOCK_JWT,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_SP_JWT_PAYLOAD)
    })

    it('should return VerifyJwtError when SingPass JWT could not be verified', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      mockClient.verifyJwt.mockRejectedValueOnce(new Error())

      // Act
      const result = await spOidcServiceClass.extractSingpassJwtPayload(
        MOCK_JWT,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(VerifyJwtError)
    })

    it('should return InvalidJwtError when SP JWT has invalid shape', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      mockClient.verifyJwt.mockResolvedValueOnce({})

      // Act
      const result = await spOidcServiceClass.extractSingpassJwtPayload(
        MOCK_JWT,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
    })
  })

  describe('extractJwtPayloadFromRequest', () => {
    it('should return a SP JWT payload when there is a valid JWT in the request', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      mockClient.verifyJwt.mockResolvedValueOnce(MOCK_SP_JWT_PAYLOAD)

      // Act
      const result = await spOidcServiceClass.extractJwtPayloadFromRequest(
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_SP_JWT_PAYLOAD)
    })

    it('should return MissingJwtError if there is no JWT when client authenticates using SP', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      // Act
      const result = await spOidcServiceClass.extractJwtPayloadFromRequest({})

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingJwtError)
    })

    it('should return InvalidJwtError when the client authenticates using SP and the JWT has wrong shape', async () => {
      // Arrange
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)

      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      mockClient.verifyJwt.mockResolvedValueOnce({})

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

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
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

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
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

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
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

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
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

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
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

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockState = `/${MOCK_TARGET}/true${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })

    it('should return InvalidStateError when state is malformed with more than 2 hyphen', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockState = `/${MOCK_TARGET}/---true${MOCK_ENCODED_QUERY}`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })

    it('should return InvalidStateError when SP formId is malformed', () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockState = `/*-true`

      // Act
      const parsedResult = spOidcServiceClass.parseState(mockState)

      // Assert
      expect(parsedResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidStateError)
    })
  })

  describe('exchangeAuthCodeAndRetrieveNric', () => {
    it('should call sp oidc client correctly and return the result', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)
      const MOCK_NRIC = 'S1234567D'

      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockResolvedValueOnce({
        payload: { sub: `s=${MOCK_NRIC}` },
      } as unknown as JWTVerifyResult)

      mockClient.extractNricFromIdToken.mockReturnValueOnce(MOCK_NRIC)

      // Act
      const result = await spOidcServiceClass.exchangeAuthCodeAndRetrieveNric(
        MOCK_SP_OIDC_AUTHORISATION_CODE,
      )

      // Assert
      expect(
        mockClient.exchangeAuthCodeAndDecodeVerifyToken,
      ).toHaveBeenCalledWith(MOCK_SP_OIDC_AUTHORISATION_CODE)
      expect(result._unsafeUnwrap()).toEqual(MOCK_NRIC)
    })

    it('should should return ExchangeAuthTokenError if client errors', async () => {
      // Arrange

      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)

      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockRejectedValueOnce(
        new Error(),
      )

      // Act
      const result = await spOidcServiceClass.exchangeAuthCodeAndRetrieveNric(
        MOCK_SP_OIDC_AUTHORISATION_CODE,
      )

      // Assert
      expect(
        mockClient.exchangeAuthCodeAndDecodeVerifyToken,
      ).toHaveBeenCalledWith(MOCK_SP_OIDC_AUTHORISATION_CODE)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ExchangeAuthTokenError)
    })
  })

  describe('createJWT', () => {
    it('should call sp oidc client with the correct params', async () => {
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)

      mockClient.createJWT.mockResolvedValueOnce(MOCK_JWT)
      const jwtResult = await spOidcServiceClass.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
      )
      expect(mockClient.createJWT).toHaveBeenCalledWith(
        MOCK_JWT_PAYLOAD,
        `${MOCK_COOKIE_AGE / 1000}s`,
      )
      expect(jwtResult._unsafeUnwrap()).toEqual(MOCK_JWT)
    })

    it('should return CreateJwtError if sp oidc client errors', async () => {
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      const mockClient = mocked(MockSpOidcClient.mock.instances[0], true)

      mockClient.createJWT.mockRejectedValueOnce(new Error())
      const jwtResult = await spOidcServiceClass.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
      )
      expect(jwtResult._unsafeUnwrapErr()).toBeInstanceOf(CreateJwtError)
    })
  })

  describe('getCookieSettings', () => {
    it('should return the correct cookie settings if spcpCookieDomain is truthy', () => {
      const spOidcServiceClass = new SpOidcServiceClass(MOCK_PARAMS)
      expect(spOidcServiceClass.getCookieSettings()).toEqual({
        domain: MOCK_PARAMS.spcpCookieDomain,
        path: '/',
      })
    })

    it('should return empty object if spcpCookieDomain is falsy', () => {
      const spOidcServiceClass = new SpOidcServiceClass(
        omit(MOCK_PARAMS, 'spcpCookieDomain') as ISpcpMyInfo,
      )
      expect(spOidcServiceClass.getCookieSettings()).toEqual({})
    })
  })
})
