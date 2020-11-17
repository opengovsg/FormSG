import { err, errAsync, ok, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { AuthType } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import * as SpcpController from '../spcp.controller'
import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  LoginPageValidationError,
} from '../spcp.errors'
import { SpcpFactory } from '../spcp.factory'

import {
  MOCK_ERROR_CODE,
  MOCK_ESRVCID,
  MOCK_LOGIN_HTML,
  MOCK_REDIRECT_URL,
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('../spcp.factory')
const MockSpcpFactory = mocked(SpcpFactory, true)

const MOCK_RESPONSE = expressHandler.mockResponse()
const MOCK_REDIRECT_REQ = expressHandler.mockRequest({
  query: {
    target: MOCK_TARGET,
    authType: AuthType.SP,
    esrvcId: MOCK_ESRVCID,
  },
})

describe('spcp.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleRedirect', () => {
    it('should return the redirect URL correctly', () => {
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )

      SpcpController.handleRedirect(MOCK_REDIRECT_REQ, MOCK_RESPONSE, jest.fn())

      expect(MockSpcpFactory.createRedirectUrl).toHaveBeenCalledWith(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(MOCK_RESPONSE.status).toHaveBeenCalledWith(200)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 500 if auth client throws an error', () => {
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        err(new CreateRedirectUrlError()),
      )

      SpcpController.handleRedirect(MOCK_REDIRECT_REQ, MOCK_RESPONSE, jest.fn())

      expect(MockSpcpFactory.createRedirectUrl).toHaveBeenCalledWith(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(MOCK_RESPONSE.status).toHaveBeenCalledWith(500)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })
  })

  describe('handleValidate', () => {
    it('should return 200 with isValid true if validation passes', async () => {
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpFactory.fetchLoginPage.mockReturnValueOnce(
        okAsync(MOCK_LOGIN_HTML),
      )
      MockSpcpFactory.validateLoginPage.mockReturnValueOnce(
        ok({ isValid: true }),
      )

      await SpcpController.handleValidate(
        MOCK_REDIRECT_REQ,
        MOCK_RESPONSE,
        jest.fn(),
      )

      expect(MockSpcpFactory.createRedirectUrl).toHaveBeenCalledWith(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(MockSpcpFactory.fetchLoginPage).toHaveBeenCalledWith(
        MOCK_REDIRECT_URL,
      )
      expect(MockSpcpFactory.validateLoginPage).toHaveBeenCalledWith(
        MOCK_LOGIN_HTML,
      )
      expect(MOCK_RESPONSE.status).toHaveBeenCalledWith(200)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        isValid: true,
      })
    })

    it('should return 200 with isValid false if validation fails', async () => {
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpFactory.fetchLoginPage.mockReturnValueOnce(
        okAsync(MOCK_LOGIN_HTML),
      )
      MockSpcpFactory.validateLoginPage.mockReturnValueOnce(
        ok({ isValid: false, errorCode: MOCK_ERROR_CODE }),
      )

      await SpcpController.handleValidate(
        MOCK_REDIRECT_REQ,
        MOCK_RESPONSE,
        jest.fn(),
      )

      expect(MockSpcpFactory.createRedirectUrl).toHaveBeenCalledWith(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(MockSpcpFactory.fetchLoginPage).toHaveBeenCalledWith(
        MOCK_REDIRECT_URL,
      )
      expect(MockSpcpFactory.validateLoginPage).toHaveBeenCalledWith(
        MOCK_LOGIN_HTML,
      )
      expect(MOCK_RESPONSE.status).toHaveBeenCalledWith(200)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        isValid: false,
        errorCode: MOCK_ERROR_CODE,
      })
    })

    it('should return 503 when FetchLoginPageError occurs', async () => {
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpFactory.fetchLoginPage.mockReturnValueOnce(
        errAsync(new FetchLoginPageError()),
      )

      await SpcpController.handleValidate(
        MOCK_REDIRECT_REQ,
        MOCK_RESPONSE,
        jest.fn(),
      )

      expect(MockSpcpFactory.createRedirectUrl).toHaveBeenCalledWith(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(MockSpcpFactory.fetchLoginPage).toHaveBeenCalledWith(
        MOCK_REDIRECT_URL,
      )
      expect(MockSpcpFactory.validateLoginPage).not.toHaveBeenCalled()
      expect(MOCK_RESPONSE.status).toHaveBeenCalledWith(503)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        message: 'Failed to contact SingPass. Please try again.',
      })
    })

    it('should return 502 when LoginPageValidationError occurs', async () => {
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpFactory.fetchLoginPage.mockReturnValueOnce(
        okAsync(MOCK_LOGIN_HTML),
      )
      MockSpcpFactory.validateLoginPage.mockReturnValueOnce(
        err(new LoginPageValidationError()),
      )

      await SpcpController.handleValidate(
        MOCK_REDIRECT_REQ,
        MOCK_RESPONSE,
        jest.fn(),
      )

      expect(MockSpcpFactory.createRedirectUrl).toHaveBeenCalledWith(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(MockSpcpFactory.fetchLoginPage).toHaveBeenCalledWith(
        MOCK_REDIRECT_URL,
      )
      expect(MockSpcpFactory.validateLoginPage).toHaveBeenCalledWith(
        MOCK_LOGIN_HTML,
      )
      expect(MOCK_RESPONSE.status).toHaveBeenCalledWith(502)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        message: 'Error while contacting SingPass. Please try again.',
      })
    })
  })
})
