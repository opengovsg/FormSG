import { err, errAsync, ok, okAsync } from 'neverthrow'

import config from 'src/app/config/config'
import * as RealFormService from 'src/app/modules/form/form.service'
import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { ApplicationError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import { SGID_COOKIE_NAME } from '../sgid.constants'
import * as SgidController from '../sgid.controller'
import {
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
  SgidInvalidStateError,
} from '../sgid.errors'
import { SgidService as RealSgidService } from '../sgid.service'

import {
  MOCK_AUTH_CODE,
  MOCK_COOKIE_SETTINGS,
  MOCK_DESTINATION,
  MOCK_JWT,
  MOCK_REMEMBER_ME,
  MOCK_SGID_FORM,
  MOCK_SP_FORM,
  MOCK_STATE,
  MOCK_TARGET,
  MOCK_TOKEN_RESULT,
  MOCK_USER_INFO,
} from './sgid.test.constants'

jest.mock('../sgid.service')
const SgidService = jest.mocked(RealSgidService)
jest.mock('src/app/modules/form/form.service')
const FormService = jest.mocked(RealFormService)
jest.mock('src/app/config/config')
const MockConfig = jest.mocked(config)
MockConfig.isDev = false

const MOCK_RESPONSE = expressHandler.mockResponse()
const MOCK_LOGIN_REQ = expressHandler.mockRequest({
  query: { code: MOCK_AUTH_CODE, state: MOCK_STATE },
})

describe('sgid.controller', () => {
  beforeEach(() => jest.clearAllMocks())
  afterAll(() => jest.clearAllMocks())

  describe('handleLogin', () => {
    beforeEach(() => {
      SgidService.parseState.mockReturnValue(
        ok({
          formId: MOCK_TARGET,
          rememberMe: MOCK_REMEMBER_ME,
        }),
      )
      FormService.retrieveFullFormById.mockReturnValue(okAsync(MOCK_SGID_FORM))
      SgidService.retrieveAccessToken.mockReturnValue(
        okAsync(MOCK_TOKEN_RESULT),
      )
      SgidService.retrieveUserInfo.mockReturnValue(okAsync(MOCK_USER_INFO))
      SgidService.createJwt.mockReturnValue(
        ok({ jwt: MOCK_JWT, maxAge: MOCK_COOKIE_AGE }),
      )
      SgidService.getCookieSettings.mockReturnValue(MOCK_COOKIE_SETTINGS)
    })

    it('should return 400 when state cannot be parsed', async () => {
      SgidService.parseState.mockReturnValue(err(new SgidInvalidStateError()))
      await SgidController.handleLogin(MOCK_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
      expect(SgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(400)
      expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
      expect(FormService.retrieveFullFormById).not.toHaveBeenCalled()
      expect(SgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(SgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(SgidService.createJwt).not.toHaveBeenCalled()
      expect(SgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should return 404 when form cannot be found', async () => {
      FormService.retrieveFullFormById.mockReturnValue(
        errAsync(new FormNotFoundError()),
      )
      await SgidController.handleLogin(MOCK_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
      expect(SgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(404)
      expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
      expect(SgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(SgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(SgidService.createJwt).not.toHaveBeenCalled()
      expect(SgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when form has wrong auth type', async () => {
      FormService.retrieveFullFormById.mockReturnValue(
        // Note that this is a CorpPass form
        okAsync(MOCK_SP_FORM),
      )
      await SgidController.handleLogin(MOCK_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
      expect(SgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
      expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
      expect(SgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(SgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(SgidService.createJwt).not.toHaveBeenCalled()
      expect(SgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when sgidService.token errors', async () => {
      SgidService.retrieveAccessToken.mockReturnValue(
        errAsync(new SgidFetchAccessTokenError()),
      )
      await SgidController.handleLogin(MOCK_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
      expect(SgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
      expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
      expect(SgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(SgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(SgidService.createJwt).not.toHaveBeenCalled()
      expect(SgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when sgidService.userinfo errors', async () => {
      SgidService.retrieveUserInfo.mockReturnValue(
        errAsync(new SgidFetchUserInfoError()),
      )
      await SgidController.handleLogin(MOCK_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
      expect(SgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(SgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(SgidService.retrieveUserInfo).toHaveBeenCalledWith(
        MOCK_TOKEN_RESULT,
      )
      expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
      expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
      expect(SgidService.createJwt).not.toHaveBeenCalled()
      expect(SgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when createJWT errors', async () => {
      SgidService.createJwt.mockReturnValue(err(new ApplicationError()))
      await SgidController.handleLogin(MOCK_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
      expect(SgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(SgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(SgidService.retrieveUserInfo).toHaveBeenCalledWith(
        MOCK_TOKEN_RESULT,
      )
      expect(SgidService.createJwt).toHaveBeenCalledWith(
        MOCK_USER_INFO.data,
        MOCK_REMEMBER_ME,
      )
      expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
      expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
      expect(SgidService.getCookieSettings).not.toHaveBeenCalled()
    })
    it('should set the cookie with the correct params and redirect to the destination', async () => {
      await SgidController.handleLogin(MOCK_LOGIN_REQ, MOCK_RESPONSE, jest.fn())
      expect(SgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(SgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(SgidService.retrieveUserInfo).toHaveBeenCalledWith(
        MOCK_TOKEN_RESULT,
      )
      expect(SgidService.createJwt).toHaveBeenCalledWith(
        MOCK_USER_INFO.data,
        MOCK_REMEMBER_ME,
      )
      expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith(
        SGID_COOKIE_NAME,
        MOCK_JWT,
        {
          maxAge: MOCK_COOKIE_AGE,
          httpOnly: true,
          sameSite: 'lax',
          secure: !MockConfig.isDev,
          ...MOCK_COOKIE_SETTINGS,
        },
      )
      expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
    })
  })
})
