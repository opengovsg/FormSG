import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import axios from 'axios'
import { mocked } from 'ts-jest/utils'

import { AuthType } from 'src/types'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  LoginPageValidationError,
  VerifyJwtError,
} from '../spcp.errors'
import { SpcpService } from '../spcp.service'

import {
  MOCK_ERROR_CODE,
  MOCK_ESRVCID,
  MOCK_JWT,
  MOCK_LOGIN_HTML,
  MOCK_REDIRECT_URL,
  MOCK_SERVICE_PARAMS as MOCK_PARAMS,
  MOCK_TARGET,
  MOCK_TITLE,
} from './spcp.test.constants'

jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation((v) => v),
  accessSync: jest.requireActual('fs').accessSync,
}))
jest.mock('axios')
const MockAxios = mocked(axios, true)

describe('spcp.service', () => {
  beforeEach(() => jest.clearAllMocks())
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
      const mockSpClient = mocked(MockAuthClient.mock.instances[0], true)
      mockSpClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockSpClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockSpClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should call CP auth client createRedirectUrl with the correct params', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)
      mockCpClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.CP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should return CreateRedirectUrlError if auth client returns error', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)
      mockCpClient.createRedirectURL.mockReturnValueOnce(new Error())
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.CP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledWith(
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
      const mockSpClient = mocked(MockAuthClient.mock.instances[0], true)
      mockSpClient.verifyJWT.mockImplementationOnce((jwt, cb) => cb(null, jwt))
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.SP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_JWT)
    })

    it('should return VerifyJwtError when SingPass JWT is invalid', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockSpClient = mocked(MockAuthClient.mock.instances[0], true)
      mockSpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
        cb(new Error(), null),
      )
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.SP)
      expect(result._unsafeUnwrapErr()).toEqual(new VerifyJwtError())
    })

    it('should return the correct payload for Corppass when JWT is valid', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)
      mockCpClient.verifyJWT.mockImplementationOnce((jwt, cb) => cb(null, jwt))
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.CP)
      expect(result._unsafeUnwrap()).toEqual(MOCK_JWT)
    })

    it('should return VerifyJwtError when CorpPass JWT is invalid', async () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)
      mockCpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
        cb(new Error(), null),
      )
      const result = await spcpService.extractJwtPayload(MOCK_JWT, AuthType.CP)
      expect(result._unsafeUnwrapErr()).toEqual(new VerifyJwtError())
    })
  })
})
