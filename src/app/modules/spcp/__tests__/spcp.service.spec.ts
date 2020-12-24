import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import axios from 'axios'
import fs from 'fs'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import getLoginModel from 'src/app/models/login.server.model'
import { MOCK_COOKIE_AGE } from 'src/app/services/myinfo/__tests__/myinfo.test.constants'
import { ISpcpMyInfo } from 'src/config/feature-manager'
import { AuthType, ILoginSchema, IPopulatedForm } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import {
  AuthTypeMismatchError,
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidOOBParamsError,
  LoginPageValidationError,
  MissingAttributesError,
  MissingJwtError,
  RetrieveAttributesError,
  VerifyJwtError,
} from '../spcp.errors'
import { SpcpService } from '../spcp.service'
import { JwtName } from '../spcp.types'

import {
  MOCK_COOKIES,
  MOCK_CP_JWT_PAYLOAD,
  MOCK_CP_SAML,
  MOCK_DESTINATION,
  MOCK_ERROR_CODE,
  MOCK_ESRVCID,
  MOCK_GET_ATTRIBUTES_RETURN_VALUE,
  MOCK_JWT,
  MOCK_JWT_PAYLOAD,
  MOCK_LOGIN_HTML,
  MOCK_REDIRECT_URL,
  MOCK_SERVICE_PARAMS as MOCK_PARAMS,
  MOCK_SP_JWT_PAYLOAD,
  MOCK_SP_SAML,
  MOCK_SP_SAML_WRONG_HASH,
  MOCK_SP_SAML_WRONG_TYPECODE,
  MOCK_TARGET,
  MOCK_TITLE,
} from './spcp.test.constants'

jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)
jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as typeof fs),
  readFileSync: jest.fn().mockImplementation((v) => v),
}))
jest.mock('axios')
const MockAxios = mocked(axios, true)

const LoginModel = getLoginModel(mongoose)

describe('spcp.service', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())
  describe('class constructor', () => {
    it('should instantiate auth clients with the correct params', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      expect(spcpService).toBeTruthy()
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
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.SP,
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
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.CP,
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
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.createRedirectURL.mockReturnValueOnce(new Error())
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.CP,
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

  describe('fetchLoginPage', () => {
    it('should GET the correct URL and return the response when request succeeds', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      MockAxios.get.mockResolvedValueOnce({
        data: MOCK_LOGIN_HTML,
      })

      const result = await spcpService.fetchLoginPage(MOCK_REDIRECT_URL)

      expect(MockAxios.get).toHaveBeenCalledWith(
        MOCK_REDIRECT_URL,
        expect.objectContaining({
          headers: {
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
          },
          timeout: 10000,
        }),
      )
      expect(result._unsafeUnwrap()).toBe(MOCK_LOGIN_HTML)
    })

    it('should return FetchLoginPageError when request fails', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      MockAxios.get.mockRejectedValueOnce('')

      const result = await spcpService.fetchLoginPage(MOCK_REDIRECT_URL)

      expect(MockAxios.get).toHaveBeenCalledWith(
        MOCK_REDIRECT_URL,
        expect.objectContaining({
          headers: {
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
          },
          timeout: 10000,
        }),
      )
      expect(result._unsafeUnwrapErr()).toEqual(new FetchLoginPageError())
    })
  })

  describe('validateLoginPage', () => {
    it('should return null when there is a title and no error', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockHtml = `<title>${MOCK_TITLE}</title>`
      const result = spcpService.validateLoginPage(mockHtml)
      expect(result._unsafeUnwrap()).toEqual({ isValid: true })
    })

    it('should return error code when there is error in title', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockHtml = `<title>Error</title>System Code:&nbsp<b>${MOCK_ERROR_CODE}</b>`
      const result = spcpService.validateLoginPage(mockHtml)
      expect(result._unsafeUnwrap()).toEqual({
        isValid: false,
        errorCode: MOCK_ERROR_CODE,
      })
    })

    it('should return LoginPageValidationError when there is no title', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockHtml = 'mock'
      const result = spcpService.validateLoginPage(mockHtml)
      expect(result._unsafeUnwrapErr()).toEqual(new LoginPageValidationError())
    })
  })

  describe('extractJwtPayload', () => {
    it('should return the correct payload for Singpass when JWT is valid', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(null, MOCK_SP_JWT_PAYLOAD),
      )
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.SP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_SP_JWT_PAYLOAD)
    })

    it('should return VerifyJwtError when SingPass JWT is invalid', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
        cb(new Error(), null),
      )
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.SP)
      expect(result._unsafeUnwrapErr()).toEqual(new VerifyJwtError())
    })

    it('should return the correct payload for Corppass when JWT is valid', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((jwt, cb) =>
        cb(null, MOCK_CP_JWT_PAYLOAD),
      )
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.CP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_CP_JWT_PAYLOAD)
    })

    it('should return VerifyJwtError when CorpPass JWT is invalid', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
        cb(new Error(), null),
      )
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.CP)
      expect(result._unsafeUnwrapErr()).toEqual(new VerifyJwtError())
    })
  })

  describe('parseOOBParams', () => {
    it('should parse SP params correctly when rememberMe is true', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
        samlArt: MOCK_SP_SAML,
      })
    })

    it('should parse CP params correctly when rememberMe is true', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
        samlArt: MOCK_CP_SAML,
      })
    })

    it('should parse SP params correctly when rememberMe is false', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},false`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.spCookieMaxAge,
        samlArt: MOCK_SP_SAML,
      })
    })

    it('should parse CP params correctly when rememberMe is false', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},false`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
        samlArt: MOCK_CP_SAML,
      })
    })

    it('should parse SP params correctly when rememberMe is malformed', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},asdf`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.spCookieMaxAge,
        samlArt: MOCK_SP_SAML,
      })
    })

    it('should parse CP params correctly when rememberMe is malformed', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},asdf`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}`,
        rememberMe: false,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
        samlArt: MOCK_CP_SAML,
      })
    })

    it('should parse SP params correctly when target has trailing slash', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}/,true`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}/`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.spCookieMaxAgePreserved,
        samlArt: MOCK_SP_SAML,
      })
    })

    it('should parse CP params correctly when target has trailing slash', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}/,true`

      const parsedResult = spcpService.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrap()).toEqual({
        formId: MOCK_TARGET,
        destination: `/${MOCK_TARGET}/`,
        rememberMe: true,
        cookieDuration: MOCK_PARAMS.cpCookieMaxAge,
        samlArt: MOCK_CP_SAML,
      })
    })

    it('should return InvalidOOBParamsError when SP relay state has 0 commas', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP relay state has 0 commas', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET}true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP relay state has >1 commas', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},t,rue`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP relay state has >1 commas', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},t,rue`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP formId is malformed', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/-,true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP formId is malformed', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/-,true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_CP_SAML,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP typecode does not match', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML_WRONG_TYPECODE,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP typecode does not match', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML_WRONG_TYPECODE,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when SP hash does not match', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML_WRONG_HASH,
        mockRelayState,
        AuthType.SP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })

    it('should return InvalidOOBParamsError when CP hash does not match', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockRelayState = `/${MOCK_TARGET},true`
      const parsedResult = spcpService.parseOOBParams(
        MOCK_SP_SAML_WRONG_HASH,
        mockRelayState,
        AuthType.CP,
      )
      expect(parsedResult._unsafeUnwrapErr()).toEqual(
        new InvalidOOBParamsError(),
      )
    })
  })

  describe('getSpcpAttributes', () => {
    it('should call SingPass auth client correctly and return the result', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.getAttributes.mockImplementationOnce((_samlArt, _dest, cb) =>
        cb(null, MOCK_GET_ATTRIBUTES_RETURN_VALUE),
      )

      const result = await spcpService.getSpcpAttributes(
        MOCK_SP_SAML,
        MOCK_DESTINATION,
        AuthType.SP,
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
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.getAttributes.mockImplementationOnce((_samlArt, _dest, cb) =>
        cb(null, MOCK_GET_ATTRIBUTES_RETURN_VALUE),
      )

      const result = await spcpService.getSpcpAttributes(
        MOCK_CP_SAML,
        MOCK_DESTINATION,
        AuthType.CP,
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
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.getAttributes.mockImplementationOnce(() => {
        throw new Error()
      })

      const result = await spcpService.getSpcpAttributes(
        MOCK_SP_SAML,
        MOCK_DESTINATION,
        AuthType.SP,
      )

      expect(mockClient.getAttributes).toHaveBeenCalledWith(
        MOCK_SP_SAML,
        MOCK_DESTINATION,
        expect.any(Function),
      )
      expect(result._unsafeUnwrapErr()).toEqual(new RetrieveAttributesError())
    })

    it('should return RetrieveAttributesError if CorpPass client errors', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.getAttributes.mockImplementationOnce(() => {
        throw new Error()
      })

      const result = await spcpService.getSpcpAttributes(
        MOCK_CP_SAML,
        MOCK_DESTINATION,
        AuthType.CP,
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
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[0], true)
      mockClient.createJWT.mockReturnValueOnce(MOCK_JWT)
      const jwtResult = spcpService.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
        AuthType.SP,
      )
      expect(mockClient.createJWT).toHaveBeenCalledWith(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE / 1000,
      )
      expect(jwtResult._unsafeUnwrap()).toEqual(MOCK_JWT)
    })

    it('should call CorpPass auth client with the correct params', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockClient = mocked(MockAuthClient.mock.instances[1], true)
      mockClient.createJWT.mockReturnValueOnce(MOCK_JWT)
      const jwtResult = spcpService.createJWT(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE,
        AuthType.CP,
      )
      expect(mockClient.createJWT).toHaveBeenCalledWith(
        MOCK_JWT_PAYLOAD,
        MOCK_COOKIE_AGE / 1000,
      )
      expect(jwtResult._unsafeUnwrap()).toEqual(MOCK_JWT)
    })
  })

  describe('addLogin', () => {
    beforeEach(() => jest.restoreAllMocks())
    it('should call LoginModel.addLoginFromForm with the given form', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockForm = ({ authType: AuthType.SP } as unknown) as IPopulatedForm
      const mockLogin = ({ esrvcId: 'esrvcId' } as unknown) as ILoginSchema
      const addLoginSpy = jest
        .spyOn(LoginModel, 'addLoginFromForm')
        .mockResolvedValueOnce(mockLogin)
      const result = await spcpService.addLogin(mockForm, AuthType.SP)
      expect(addLoginSpy).toHaveBeenCalledWith(mockForm)
      expect(result._unsafeUnwrap()).toEqual(mockLogin)
    })

    it('should return AuthTypeMismatchError when auth types do not match', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockForm = ({ authType: AuthType.CP } as unknown) as IPopulatedForm
      const mockLogin = ({ esrvcId: 'esrvcId' } as unknown) as ILoginSchema
      const addLoginSpy = jest
        .spyOn(LoginModel, 'addLoginFromForm')
        .mockResolvedValueOnce(mockLogin)
      const result = await spcpService.addLogin(mockForm, AuthType.SP)
      expect(addLoginSpy).not.toHaveBeenCalled()
      expect(result._unsafeUnwrapErr()).toEqual(
        new AuthTypeMismatchError(AuthType.SP, AuthType.CP),
      )
    })

    it('should return DatabaseError when adding login fails', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const mockForm = ({ authType: AuthType.SP } as unknown) as IPopulatedForm
      const addLoginSpy = jest
        .spyOn(LoginModel, 'addLoginFromForm')
        .mockRejectedValueOnce('')
      const result = await spcpService.addLogin(mockForm, AuthType.SP)
      expect(addLoginSpy).toHaveBeenCalledWith(mockForm)
      expect(result._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })

  describe('createJWTPayload', () => {
    it('should return the correct SingPass attributes', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.createJWTPayload(
        { UserName: MOCK_JWT_PAYLOAD.userName },
        true,
        AuthType.SP,
      )
      expect(result._unsafeUnwrap()).toEqual({
        userName: MOCK_JWT_PAYLOAD.userName,
        rememberMe: true,
      })
    })

    it('should return MissingAttributesError if SP UserName does not exist', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.createJWTPayload({}, true, AuthType.SP)
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })

    it('should return the correct CorpPass attributes', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.createJWTPayload(
        {
          UserInfo: {
            CPEntID: MOCK_JWT_PAYLOAD.userName,
            CPUID: MOCK_JWT_PAYLOAD.userInfo,
          },
        },
        true,
        AuthType.CP,
      )
      expect(result._unsafeUnwrap()).toEqual({
        userName: MOCK_JWT_PAYLOAD.userName,
        userInfo: MOCK_JWT_PAYLOAD.userInfo,
        rememberMe: true,
      })
    })

    it('should return MissingAttributesError if CorpPass UserInfo is missing', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.createJWTPayload({}, true, AuthType.SP)
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })

    it('should return MissingAttributesError if CorpPass CPEntID is missing', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.createJWTPayload(
        {
          UserInfo: {
            CPUID: MOCK_JWT_PAYLOAD.userInfo,
          },
        },
        true,
        AuthType.CP,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })

    it('should return MissingAttributesError if CorpPass CPUID is missing', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.createJWTPayload(
        {
          UserInfo: {
            CPEntID: MOCK_JWT_PAYLOAD.userName,
          },
        },
        true,
        AuthType.CP,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MissingAttributesError())
    })
  })

  describe('getCookieSettings', () => {
    it('should return the correct cookie settings if spcpCookieDomain is truthy', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      expect(spcpService.getCookieSettings()).toEqual({
        domain: MOCK_PARAMS.spcpCookieDomain,
        path: '/',
      })
    })

    it('should return empty object if spcpCookieDomain is falsy', () => {
      const spcpService = new SpcpService(
        omit(MOCK_PARAMS, 'spcpCookieDomain') as ISpcpMyInfo,
      )
      expect(spcpService.getCookieSettings()).toEqual({})
    })
  })

  describe('extractJwt', () => {
    it('should return SingPass JWT correctly', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.extractJwt(MOCK_COOKIES, AuthType.SP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_COOKIES[JwtName.SP])
    })

    it('should return CorpPass JWT correctly', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.extractJwt(MOCK_COOKIES, AuthType.CP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_COOKIES[JwtName.CP])
    })

    it('should return MissingJwtError if there is no JWT', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      const result = spcpService.extractJwt({}, AuthType.CP)
      expect(result._unsafeUnwrapErr()).toEqual(new MissingJwtError())
    })
  })
})
