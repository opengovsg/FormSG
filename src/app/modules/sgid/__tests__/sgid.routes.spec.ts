import { err, errAsync, ok, okAsync } from 'neverthrow'
import session from 'supertest-session'

import config from 'src/app/config/config'
import * as RealFormService from 'src/app/modules/form/form.service'
import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'

import { ApplicationError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import { SGID_COOKIE_NAME } from '../sgid.constants'
import {
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
  SgidInvalidStateError,
} from '../sgid.errors'
import { SgidRouter } from '../sgid.routes'
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
const sgidService = jest.mocked(RealSgidService)
jest.mock('src/app/modules/form/form.service')
const FormService = jest.mocked(RealFormService)
jest.mock('src/app/config/config')
const MockConfig = jest.mocked(config)
MockConfig.isDev = false

const app = setupApp('/sgid', SgidRouter)

const MOCK_LOGIN_QUERY = { code: MOCK_AUTH_CODE, state: MOCK_STATE }

describe('sgid.controller', () => {
  beforeEach(() => jest.clearAllMocks())
  afterAll(() => jest.clearAllMocks())
  const LOGIN_ROUTE = '/sgid/login'
  describe(`GET ${LOGIN_ROUTE}`, () => {
    beforeEach(() => {
      sgidService.parseState.mockReturnValue(
        ok({
          formId: MOCK_TARGET,
          rememberMe: MOCK_REMEMBER_ME,
        }),
      )
      FormService.retrieveFullFormById.mockReturnValue(okAsync(MOCK_SGID_FORM))
      sgidService.retrieveAccessToken.mockReturnValue(
        okAsync(MOCK_TOKEN_RESULT),
      )
      sgidService.retrieveUserInfo.mockReturnValue(okAsync(MOCK_USER_INFO))
      sgidService.createJwt.mockReturnValue(
        ok({ jwt: MOCK_JWT, maxAge: MOCK_COOKIE_AGE }),
      )
      sgidService.getCookieSettings.mockReturnValue(MOCK_COOKIE_SETTINGS)
    })

    it('should return 400 on missing code', async () => {
      sgidService.parseState.mockReturnValue(err(new SgidInvalidStateError()))
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query({ state: MOCK_LOGIN_QUERY.state })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'code' } }),
      )

      expect(sgidService.parseState).not.toHaveBeenCalled()
      expect(FormService.retrieveFullFormById).not.toHaveBeenCalled()
      expect(sgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(sgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(sgidService.createJwt).not.toHaveBeenCalled()
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should return 400 on missing state', async () => {
      sgidService.parseState.mockReturnValue(err(new SgidInvalidStateError()))
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query({ code: MOCK_LOGIN_QUERY.code })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'state' } }),
      )

      expect(sgidService.parseState).not.toHaveBeenCalled()
      expect(FormService.retrieveFullFormById).not.toHaveBeenCalled()
      expect(sgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(sgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(sgidService.createJwt).not.toHaveBeenCalled()
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should return 400 when state cannot be parsed', async () => {
      sgidService.parseState.mockReturnValue(err(new SgidInvalidStateError()))
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query(MOCK_LOGIN_QUERY)

      expect(response.status).toBe(400)

      expect(sgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).not.toHaveBeenCalled()
      expect(sgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(sgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(sgidService.createJwt).not.toHaveBeenCalled()
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should return 404 when form cannot be found', async () => {
      FormService.retrieveFullFormById.mockReturnValue(
        errAsync(new FormNotFoundError()),
      )
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query(MOCK_LOGIN_QUERY)

      expect(response.status).toBe(404)

      expect(sgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(sgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(sgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(sgidService.createJwt).not.toHaveBeenCalled()
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when form has wrong auth type', async () => {
      FormService.retrieveFullFormById.mockReturnValue(
        // Note that this is a SingPass form
        okAsync(MOCK_SP_FORM),
      )
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query(MOCK_LOGIN_QUERY)

      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining('isLoginError=true'),
      ])
      expect(response.status).toBe(302)
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)

      expect(sgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(sgidService.retrieveAccessToken).not.toHaveBeenCalled()
      expect(sgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(sgidService.createJwt).not.toHaveBeenCalled()
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when sgidService.token errors', async () => {
      sgidService.retrieveAccessToken.mockReturnValue(
        errAsync(new SgidFetchAccessTokenError()),
      )
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query(MOCK_LOGIN_QUERY)

      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining('isLoginError=true'),
      ])
      expect(response.status).toBe(302)
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)

      expect(sgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(sgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(sgidService.retrieveUserInfo).not.toHaveBeenCalled()
      expect(sgidService.createJwt).not.toHaveBeenCalled()
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when sgidService.userinfo errors', async () => {
      sgidService.retrieveUserInfo.mockReturnValue(
        errAsync(new SgidFetchUserInfoError()),
      )
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query(MOCK_LOGIN_QUERY)

      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining('isLoginError=true'),
      ])
      expect(response.status).toBe(302)
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)

      expect(sgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(sgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(sgidService.retrieveUserInfo).toHaveBeenCalledWith(
        MOCK_TOKEN_RESULT,
      )
      expect(sgidService.createJwt).not.toHaveBeenCalled()
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })

    it('should set isLoginError cookie and redirect when createJWT errors', async () => {
      sgidService.createJwt.mockReturnValue(err(new ApplicationError()))
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query(MOCK_LOGIN_QUERY)

      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining('isLoginError=true'),
      ])
      expect(response.status).toBe(302)
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)

      expect(sgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(sgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(sgidService.retrieveUserInfo).toHaveBeenCalledWith(
        MOCK_TOKEN_RESULT,
      )
      expect(sgidService.createJwt).toHaveBeenCalledWith(
        MOCK_USER_INFO.data,
        MOCK_REMEMBER_ME,
      )
      expect(sgidService.getCookieSettings).not.toHaveBeenCalled()
    })
    it('should set the cookie with the correct params and redirect to the destination', async () => {
      const response = await session(app)
        .get(LOGIN_ROUTE)
        .query(MOCK_LOGIN_QUERY)

      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`${SGID_COOKIE_NAME}=${MOCK_JWT}`),
      ])
      expect(response.status).toBe(302)
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)

      expect(sgidService.parseState).toHaveBeenCalledWith(MOCK_STATE)
      expect(FormService.retrieveFullFormById).toHaveBeenCalledWith(MOCK_TARGET)
      expect(sgidService.retrieveAccessToken).toHaveBeenCalledWith(
        MOCK_AUTH_CODE,
      )
      expect(sgidService.retrieveUserInfo).toHaveBeenCalledWith(
        MOCK_TOKEN_RESULT,
      )
      expect(sgidService.createJwt).toHaveBeenCalledWith(
        MOCK_USER_INFO.data,
        MOCK_REMEMBER_ME,
      )
    })
  })
})
