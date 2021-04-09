import { err, errAsync, ok, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import config from 'src/app/config/config'
import * as FormService from 'src/app/modules/form/form.service'
import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'
import { AuthType } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { BillingFactory } from '../../billing/billing.factory'
import { ApplicationError, DatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as SpcpController from '../spcp.controller'
import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidOOBParamsError,
  LoginPageValidationError,
  MissingAttributesError,
  RetrieveAttributesError,
} from '../spcp.errors'
import { SpcpFactory } from '../spcp.factory'

import {
  MOCK_ATTRIBUTES,
  MOCK_COOKIE_SETTINGS,
  MOCK_CP_FORM,
  MOCK_CP_SAML,
  MOCK_DESTINATION,
  MOCK_ERROR_CODE,
  MOCK_ESRVCID,
  MOCK_JWT,
  MOCK_JWT_PAYLOAD,
  MOCK_LOGIN_DOC,
  MOCK_LOGIN_HTML,
  MOCK_REDIRECT_URL,
  MOCK_RELAY_STATE,
  MOCK_REMEMBER_ME,
  MOCK_SP_FORM,
  MOCK_SP_SAML,
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('../spcp.factory')
const MockSpcpFactory = mocked(SpcpFactory, true)
jest.mock('../../billing/billing.factory')
const MockBillingFactory = mocked(BillingFactory, true)
jest.mock('src/app/modules/form/form.service')
const MockFormService = mocked(FormService, true)
jest.mock('src/config/config')
const MockConfig = mocked(config, true)
MockConfig.isDev = false

const MOCK_RESPONSE = expressHandler.mockResponse()
const MOCK_REDIRECT_REQ = expressHandler.mockRequest({
  query: {
    target: MOCK_RELAY_STATE,
    authType: AuthType.SP as const,
    esrvcId: MOCK_ESRVCID,
  },
})
const MOCK_VALIDATE_REQ = expressHandler.mockRequest({
  query: {
    target: MOCK_TARGET,
    authType: AuthType.SP as const,
    esrvcId: MOCK_ESRVCID,
  },
})
const MOCK_SP_LOGIN_REQ = expressHandler.mockRequest({
  query: { SAMLart: MOCK_SP_SAML, RelayState: MOCK_RELAY_STATE },
})
const MOCK_CP_LOGIN_REQ = expressHandler.mockRequest({
  query: { SAMLart: MOCK_CP_SAML, RelayState: MOCK_RELAY_STATE },
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
        MOCK_RELAY_STATE,
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
        MOCK_RELAY_STATE,
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
        MOCK_VALIDATE_REQ,
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
        MOCK_VALIDATE_REQ,
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
        MOCK_VALIDATE_REQ,
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
        MOCK_VALIDATE_REQ,
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

  describe('handleLogin', () => {
    describe('(Singpass)', () => {
      const loginHandler = SpcpController.handleLogin(AuthType.SP)

      beforeEach(() => {
        MockSpcpFactory.parseOOBParams.mockReturnValue(
          ok({
            formId: MOCK_TARGET,
            destination: MOCK_DESTINATION,
            rememberMe: MOCK_REMEMBER_ME,
            cookieDuration: MOCK_COOKIE_AGE,
            samlArt: MOCK_SP_SAML,
          }),
        )
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_SP_FORM),
        )
        MockSpcpFactory.getSpcpAttributes.mockReturnValue(
          okAsync(MOCK_ATTRIBUTES),
        )
        MockSpcpFactory.createJWTPayload.mockReturnValue(ok(MOCK_JWT_PAYLOAD))
        MockSpcpFactory.createJWT.mockReturnValue(ok(MOCK_JWT))
        MockBillingFactory.recordLoginByForm.mockReturnValue(
          okAsync(MOCK_LOGIN_DOC),
        )
        MockSpcpFactory.getCookieSettings.mockReturnValue(MOCK_COOKIE_SETTINGS)
      })

      it('should set the cookie with the correct params and redirect to the destination', async () => {
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_DESTINATION,
          AuthType.SP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.SP,
        )
        expect(MockSpcpFactory.createJWT).toHaveBeenCalledWith(
          MOCK_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
          AuthType.SP,
        )
        expect(MockBillingFactory.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_SP_FORM,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('jwtSp', MOCK_JWT, {
          maxAge: MOCK_COOKIE_AGE,
          httpOnly: false,
          sameSite: 'lax',
          secure: !MockConfig.isDev,
          ...MOCK_COOKIE_SETTINGS,
        })
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
      })

      it('should return 400 when params cannot be parsed', async () => {
        MockSpcpFactory.parseOOBParams.mockReturnValue(
          err(new InvalidOOBParamsError()),
        )
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(400)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getSpcpAttributes).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should return 404 when form cannot be found', async () => {
        MockFormService.retrieveFullFormById.mockReturnValue(
          errAsync(new FormNotFoundError()),
        )
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(404)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getSpcpAttributes).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when form has wrong auth type', async () => {
        MockFormService.retrieveFullFormById.mockReturnValue(
          // Note that this is a CorpPass form
          okAsync(MOCK_CP_FORM),
        )
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.getSpcpAttributes).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when getSpcpAttributes errors', async () => {
        MockSpcpFactory.getSpcpAttributes.mockReturnValue(
          errAsync(new RetrieveAttributesError()),
        )
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_DESTINATION,
          AuthType.SP,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWTPayload errors', async () => {
        MockSpcpFactory.createJWTPayload.mockReturnValue(
          err(new MissingAttributesError()),
        )
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_DESTINATION,
          AuthType.SP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.SP,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWT errors', async () => {
        MockSpcpFactory.createJWT.mockReturnValue(err(new ApplicationError()))
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_DESTINATION,
          AuthType.SP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.SP,
        )
        expect(MockSpcpFactory.createJWT).toHaveBeenCalledWith(
          MOCK_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
          AuthType.SP,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when recordLoginByForm errors', async () => {
        MockBillingFactory.recordLoginByForm.mockReturnValue(
          errAsync(new DatabaseError()),
        )
        await loginHandler(MOCK_SP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_RELAY_STATE,
          AuthType.SP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_SP_SAML,
          MOCK_DESTINATION,
          AuthType.SP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.SP,
        )
        expect(MockSpcpFactory.createJWT).toHaveBeenCalledWith(
          MOCK_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
          AuthType.SP,
        )
        expect(MockBillingFactory.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_SP_FORM,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })
    })

    describe('(Corppass)', () => {
      const loginHandler = SpcpController.handleLogin(AuthType.CP)

      beforeEach(() => {
        MockSpcpFactory.parseOOBParams.mockReturnValue(
          ok({
            formId: MOCK_TARGET,
            destination: MOCK_DESTINATION,
            rememberMe: MOCK_REMEMBER_ME,
            cookieDuration: MOCK_COOKIE_AGE,
            samlArt: MOCK_CP_SAML,
          }),
        )
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_CP_FORM),
        )
        MockSpcpFactory.getSpcpAttributes.mockReturnValue(
          okAsync(MOCK_ATTRIBUTES),
        )
        MockSpcpFactory.createJWTPayload.mockReturnValue(ok(MOCK_JWT_PAYLOAD))
        MockSpcpFactory.createJWT.mockReturnValue(ok(MOCK_JWT))
        MockBillingFactory.recordLoginByForm.mockReturnValue(
          okAsync(MOCK_LOGIN_DOC),
        )
        MockSpcpFactory.getCookieSettings.mockReturnValue(MOCK_COOKIE_SETTINGS)
      })

      it('should set the cookie with the correct params and redirect to the destination', async () => {
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_DESTINATION,
          AuthType.CP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.CP,
        )
        expect(MockSpcpFactory.createJWT).toHaveBeenCalledWith(
          MOCK_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
          AuthType.CP,
        )
        expect(MockBillingFactory.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_CP_FORM,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('jwtCp', MOCK_JWT, {
          maxAge: MOCK_COOKIE_AGE,
          httpOnly: false,
          sameSite: 'lax',
          secure: !MockConfig.isDev,
          ...MOCK_COOKIE_SETTINGS,
        })
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
      })

      it('should return 400 when params cannot be parsed', async () => {
        MockSpcpFactory.parseOOBParams.mockReturnValue(
          err(new InvalidOOBParamsError()),
        )
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(400)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getSpcpAttributes).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when form has wrong auth type', async () => {
        MockFormService.retrieveFullFormById.mockReturnValue(
          // Note that this is a SingPass form
          okAsync(MOCK_SP_FORM),
        )
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.getSpcpAttributes).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should return 404 when form cannot be found', async () => {
        MockFormService.retrieveFullFormById.mockReturnValue(
          errAsync(new FormNotFoundError()),
        )
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(404)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getSpcpAttributes).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when getSpcpAttributes errors', async () => {
        MockSpcpFactory.getSpcpAttributes.mockReturnValue(
          errAsync(new RetrieveAttributesError()),
        )
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_DESTINATION,
          AuthType.CP,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.createJWTPayload).not.toHaveBeenCalled()
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWTPayload errors', async () => {
        MockSpcpFactory.createJWTPayload.mockReturnValue(
          err(new MissingAttributesError()),
        )
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_DESTINATION,
          AuthType.CP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.CP,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.createJWT).not.toHaveBeenCalled()
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWT errors', async () => {
        MockSpcpFactory.createJWT.mockReturnValue(err(new ApplicationError()))
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_DESTINATION,
          AuthType.CP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.CP,
        )
        expect(MockSpcpFactory.createJWT).toHaveBeenCalledWith(
          MOCK_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
          AuthType.CP,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockBillingFactory.recordLoginByForm).not.toHaveBeenCalled()
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when recordLoginByForm errors', async () => {
        MockBillingFactory.recordLoginByForm.mockReturnValue(
          errAsync(new DatabaseError()),
        )
        await loginHandler(MOCK_CP_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
        expect(MockSpcpFactory.parseOOBParams).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_RELAY_STATE,
          AuthType.CP,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MockSpcpFactory.getSpcpAttributes).toHaveBeenCalledWith(
          MOCK_CP_SAML,
          MOCK_DESTINATION,
          AuthType.CP,
        )
        expect(MockSpcpFactory.createJWTPayload).toHaveBeenCalledWith(
          MOCK_ATTRIBUTES,
          MOCK_REMEMBER_ME,
          AuthType.CP,
        )
        expect(MockSpcpFactory.createJWT).toHaveBeenCalledWith(
          MOCK_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
          AuthType.CP,
        )
        expect(MockBillingFactory.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_CP_FORM,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MockSpcpFactory.getCookieSettings).not.toHaveBeenCalled()
      })
    })
  })
})
