import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import fs from 'fs'
import { omit } from 'lodash'
import { mocked } from 'ts-jest/utils'

import { ISpcpMyInfo } from 'src/app/config/features/spcp-myinfo.config'
import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType } from '../../../../../shared/types'
import {
  CreateRedirectUrlError,
  InvalidJwtError,
  InvalidOOBParamsError,
  MissingAttributesError,
  MissingJwtError,
  RetrieveAttributesError,
  VerifyJwtError,
} from '../spcp.errors'
import { SpcpServiceClass } from '../spcp.service'
import { JwtName } from '../spcp.types'

import {
  MOCK_COOKIES,
  MOCK_CP_JWT_PAYLOAD,
  MOCK_CP_SAML,
  MOCK_DECODED_QUERY,
  MOCK_DESTINATION,
  MOCK_ENCODED_QUERY,
  MOCK_ESRVCID,
  MOCK_GET_ATTRIBUTES_RETURN_VALUE,
  MOCK_JWT,
  MOCK_JWT_PAYLOAD,
  MOCK_REDIRECT_URL,
  MOCK_SERVICE_PARAMS as MOCK_PARAMS,
  MOCK_SP_JWT_PAYLOAD,
  MOCK_SP_SAML,
  MOCK_SP_SAML_WRONG_HASH,
  MOCK_SP_SAML_WRONG_TYPECODE,
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)
jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as typeof fs),
  readFileSync: jest.fn().mockImplementation((v) => v),
}))

describe('spcp.service', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())
  describe('class constructor', () => {
    it('should instantiate auth clients with the correct params', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      expect(spcpServiceClass).toBeTruthy()
      expect(MockAuthClient).toHaveBeenCalledTimes(2)
      expect(MockAuthClient).toHaveBeenCalledWith({
        partnerEntityId: MOCK_PARAMS.spPartnerEntityId,
        idpLoginURL: MOCK_PARAMS.spIdpLoginUrl,
        idpEndpoint: MOCK_PARAMS.spIdpEndpoint,
        esrvcID: MOCK_PARAMS.spEsrvcId,
        appKey: MOCK_PARAMS.spFormSgKeyPath,
        appCert: MOCK_PARAMS.spFormSgCertPath,
        spcpCert: MOCK_PARAMS.spIdpCertPath,
        extract: SPCPAuthClient.extract.SINGPASS,
      })
      expect(MockAuthClient).toHaveBeenCalledWith({
        partnerEntityId: MOCK_PARAMS.cpPartnerEntityId,
        idpLoginURL: MOCK_PARAMS.cpIdpLoginUrl,
        idpEndpoint: MOCK_PARAMS.cpIdpEndpoint,
        esrvcID: MOCK_PARAMS.cpEsrvcId,
        appKey: MOCK_PARAMS.cpFormSgKeyPath,
        appCert: MOCK_PARAMS.cpFormSgCertPath,
        spcpCert: MOCK_PARAMS.cpIdpCertPath,
        extract: SPCPAuthClient.extract.CORPPASS,
      })
    })
  })

  describe('createRedirectUrl', () => {
    it('should call SP auth client createRedirectUrl with the correct params', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpServiceClass.createRedirectUrl(
        FormAuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should call CP auth client createRedirectUrl with the correct params', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpServiceClass.createRedirectUrl(
        FormAuthType.CP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should return CreateRedirectUrlError if auth client returns error', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.createRedirectURL.mockReturnValueOnce(new Error())
      const redirectUrl = spcpServiceClass.createRedirectUrl(
        FormAuthType.CP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrapErr()).toEqual(
        new CreateRedirectUrlError(),
      )
    })
  })

  describe('extractSingpassJwtPayload', () => {
    it('should return the correct payload for Singpass when JWT is valid', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(null, MOCK_SP_JWT_PAYLOAD),
      )
      const result = await spcpServiceClass.extractSingpassJwtPayload(MOCK_JWT)
      expect(result._unsafeUnwrap()).toEqual(MOCK_SP_JWT_PAYLOAD)
    })

    it('should return VerifyJwtError when SingPass JWT could not be verified', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
        cb(new Error(), null),
      )
      const result = await spcpServiceClass.extractSingpassJwtPayload(MOCK_JWT)
      expect(result._unsafeUnwrapErr()).toEqual(new VerifyJwtError())
    })

    it('should return InvalidJwtError when SP JWT has invalid shape', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) => cb(null, {}))
      const expected = new InvalidJwtError()

      // Act
      const result = await spcpServiceClass.extractSingpassJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })
  })

  describe('extractCorppassJwtPayload', () => {
    it('should return the correct payload for Corppass when JWT is valid', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(null, MOCK_CP_JWT_PAYLOAD),
      )
      const result = await spcpServiceClass.extractCorppassJwtPayload(MOCK_JWT)
      expect(result._unsafeUnwrap()).toEqual(MOCK_CP_JWT_PAYLOAD)
    })

    it('should return VerifyJwtError when CorpPass JWT could not be verified', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
        cb(new Error(), null),
      )
      const result = await spcpServiceClass.extractCorppassJwtPayload(MOCK_JWT)
      expect(result._unsafeUnwrapErr()).toEqual(new VerifyJwtError())
    })

    it('should return InvalidJwtError when CorpPass JWT has invalid shape', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) => cb(null, {}))
      const expected = new InvalidJwtError()

      // Act
      const result = await spcpServiceClass.extractCorppassJwtPayload(MOCK_JWT)

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })
  })

  describe('parseOOBParams', () => {
    it('should parse SP params correctly when rememberMe is true', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
      })
    })

    it('should parse CP params correctly when rememberMe is true', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should parse SP params correctly when rememberMe is false', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},false`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.spCookieMaxAge,
      })
    })

    it('should parse CP params correctly when rememberMe is false', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},false`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should parse SP params correctly when rememberMe is malformed', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},asdf`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.spCookieMaxAge,
      })
    })

    it('should parse CP params correctly when rememberMe is malformed', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},asdf`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should parse SP params correctly when target has trailing slash', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}/,true`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}/`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
      })
    })

    it('should parse CP params correctly when target has trailing slash', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}/,true`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}/`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
      })
    })

    it('should parse SP params correctly when there is encodedQuery payload', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true,${MOCK_ENCODED_QUERY}`

      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}${MOCK_DECODED_QUERY}`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
      })
    })

    it('should return InvalidOOBParamsError when SP relay state has 0 commas', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP relay state has 0 commas', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP relay state has >2 commas', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},t,r,ue`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP relay state has >2 commas', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},t,r,ue`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP formId is malformed', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/-,true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP formId is malformed', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/-,true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP typecode does not match', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML_WRONG_TYPECODE,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP typecode does not match', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML_WRONG_TYPECODE,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP hash does not match', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML_WRONG_HASH,
        mockRelayState,
        FormAuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP hash does not match', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpServiceClass.parseOOBParams(
        MOCK_SP_SAML_WRONG_HASH,
        mockRelayState,
        FormAuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })
  })

  describe('getSpcpAttributes', () => {
    it('should call SingPass auth client correctly and return the result', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.getAttributes.mockImplementationOnce((_samlArt, _dest, cb) =>
        cb(null, MOCK_GET_ATTRIBUTES_RETURN_VALUE),
      )

      const result = await spcpServiceClass.getSpcpAttributes(
        MOCK_SP_SAML,
        MOCK_DESTINATION,
        FormAuthType.SP,
      )

      expect(mockClient.getAttributes).toHaveBeenCalledWith(
        MOCK_SP_SAML,
        MOCK_DESTINATION,
        expect.any(Function),
      )
      expect(result._unsafeUnwrap()).toEqual(
        MOCK_GET_ATTRIBUTES_RETURN_VALUE.attributes,
      )
    })

    it('should call CorpPass auth client correctly and return the result', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.getAttributes.mockImplementationOnce((_samlArt, _dest, cb) =>
        cb(null, MOCK_GET_ATTRIBUTES_RETURN_VALUE),
      )

      const result = await spcpServiceClass.getSpcpAttributes(
        MOCK_CP_SAML,
        MOCK_DESTINATION,
        FormAuthType.CP,
      )

      expect(mockClient.getAttributes).toHaveBeenCalledWith(
        MOCK_CP_SAML,
        MOCK_DESTINATION,
        expect.any(Function),
      )
      expect(result._unsafeUnwrap()).toEqual(
        MOCK_GET_ATTRIBUTES_RETURN_VALUE.attributes,
      )
    })

    it('should return RetrieveAttributesError if SingPass client errors', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.getAttributes.mockImplementationOnce(() => {
        throw new Error()
      })

      const result = await spcpServiceClass.getSpcpAttributes(
        MOCK_SP_SAML,
        MOCK_DESTINATION,
        FormAuthType.SP,
      )

      expect(mockClient.getAttributes).toHaveBeenCalledWith(
        MOCK_SP_SAML,
        MOCK_DESTINATION,
        expect.any(Function),
      )
      expect(result._unsafeUnwrapErr()).toEqual(new RetrieveAttributesError())
    })

    it('should return RetrieveAttributesError if CorpPass client errors', async () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.getAttributes.mockImplementationOnce(() => {
        throw new Error()
      })

      const result = await spcpServiceClass.getSpcpAttributes(
        MOCK_CP_SAML,
        MOCK_DESTINATION,
        FormAuthType.CP,
      )

      expect(mockClient.getAttributes).toHaveBeenCalledWith(
        MOCK_CP_SAML,
        MOCK_DESTINATION,
        expect.any(Function),
      )
      expect(result._unsafeUnwrapErr()).toEqual(new RetrieveAttributesError())
    })
  })

  describe('createJWT', () => {
    it('should call SingPass auth client with the correct params', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.createJWT.mockReturnValueOnce(MOCK_JWT)
      const jwtResult = spcpServiceClass.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
        FormAuthType.SP,
      )
      expect(mockClient.createJWT).toHaveBeenCalledWith(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE / 1000,
      )
      expect(jwtResult._unsafeUnwrap()).toEqual(MOCK_JWT)
    })

    it('should call CorpPass auth client with the correct params', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.createJWT.mockReturnValueOnce(MOCK_JWT)
      const jwtResult = spcpServiceClass.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
        FormAuthType.CP,
      )
      expect(mockClient.createJWT).toHaveBeenCalledWith(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE / 1000,
      )
      expect(jwtResult._unsafeUnwrap()).toEqual(MOCK_JWT)
    })
  })

  describe('createJWTPayload', () => {
    it('should return the correct SingPass attributes', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.createJWTPayload(
        { UserName: MOCK_JWT_PAYLOAD.userName },
        true,
        FormAuthType.SP,
      )
      expect(result._unsafeUnwrap()).toEqual({
        userName: MOCK_JWT_PAYLOAD.userName,
        rememberMe: true,
      })
    })

    it('should return MissingAttributesError if SP UserName does not exist', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.createJWTPayload(
        {},
        true,
        FormAuthType.SP,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })

    it('should return the correct CorpPass attributes', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.createJWTPayload(
        {
          UserInfo: {
            CPEntID: MOCK_JWT_PAYLOAD.userName,
            CPUID: MOCK_JWT_PAYLOAD.userInfo,
          },
        },
        true,
        FormAuthType.CP,
      )
      expect(result._unsafeUnwrap()).toEqual({
        userName: MOCK_JWT_PAYLOAD.userName,
        userInfo: MOCK_JWT_PAYLOAD.userInfo,
        rememberMe: true,
      })
    })

    it('should return MissingAttributesError if CorpPass UserInfo is missing', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.createJWTPayload(
        {},
        true,
        FormAuthType.SP,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })

    it('should return MissingAttributesError if CorpPass CPEntID is missing', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.createJWTPayload(
        {
          UserInfo: {
            CPUID: MOCK_JWT_PAYLOAD.userInfo,
          },
        },
        true,
        FormAuthType.CP,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })

    it('should return MissingAttributesError if CorpPass CPUID is missing', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.createJWTPayload(
        {
          UserInfo: {
            CPEntID: MOCK_JWT_PAYLOAD.userName,
          },
        },
        true,
        FormAuthType.CP,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })
  })

  describe('getCookieSettings', () => {
    it('should return the correct cookie settings if spcpCookieDomain is truthy', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      expect(spcpServiceClass.getCookieSettings()).toEqual({
        domain: MOCK_PARAMS.spcpCookieDomain,
        path: '/',
      })
    })

    it('should return empty object if spcpCookieDomain is falsy', () => {
      const spcpServiceClass = new SpcpServiceClass(
        omit(MOCK_PARAMS, 'spcpCookieDomain') as ISpcpMyInfo,
      )
      expect(spcpServiceClass.getCookieSettings()).toEqual({})
    })
  })

  describe('extractJwt', () => {
    it('should return SingPass JWT correctly', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.extractJwt(MOCK_COOKIES, FormAuthType.SP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_COOKIES[JwtName.SP])
    })

    it('should return CorpPass JWT correctly', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.extractJwt(MOCK_COOKIES, FormAuthType.CP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_COOKIES[JwtName.CP])
    })

    it('should return MissingJwtError if there is no JWT', () => {
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const result = spcpServiceClass.extractJwt({}, FormAuthType.CP)
      expect(result._unsafeUnwrapErr()).toEqual(new MissingJwtError())
    })
  })

  describe('extractJwtPayloadFromRequest', () => {
    it('should return a SP JWT payload when there is a valid JWT in the request', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(null, MOCK_SP_JWT_PAYLOAD),
      )

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.SP,
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_SP_JWT_PAYLOAD)
    })

    it('should return a CP JWT payload when there is a valid JWT in the request', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that CP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(null, MOCK_CP_JWT_PAYLOAD),
      )

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.CP,
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual(MOCK_CP_JWT_PAYLOAD)
    })

    it('should return MissingJwtError if there is no JWT when client authenticates using SP', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const expected = new MissingJwtError()

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.SP,
        {},
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })

    it('should return MissingJwtError when client authenticates using CP and there is no JWT', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      const expected = new MissingJwtError()

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.CP,
        {},
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })

    it('should return InvalidJwtError when the client authenticates using SP and the JWT has wrong shape', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(new Error(), null),
      )
      const expected = new VerifyJwtError()

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.SP,
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })

    it('should return VerifyJwtError when the client authenticates using CP and the JWT has wrong shape', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(new Error(), null),
      )
      const expected = new VerifyJwtError()

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.CP,
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })
    it('should return InvalidJwtError when the client authenticates using SP and the JWT has invalid shape', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) => cb(null, {}))
      const expected = new InvalidJwtError()

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.SP,
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })

    it('should return InvalidJwtError when the client authenticates using CP and the JWT has invalid shape', async () => {
      // Arrange
      const spcpServiceClass = new SpcpServiceClass(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) => cb(null, {}))
      const expected = new InvalidJwtError()

      // Act
      const result = await spcpServiceClass.extractJwtPayloadFromRequest(
        FormAuthType.CP,
        MOCK_COOKIES,
      )

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(expected)
    })
  })
})
