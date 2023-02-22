import { StatusCodes } from 'http-status-codes'
import { err, errAsync, ok, okAsync } from 'neverthrow'

import { IFormSchema } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import {
  MYINFO_AUTH_CODE_COOKIE_NAME,
  MYINFO_AUTH_CODE_COOKIE_OPTIONS,
} from '../myinfo.constants'
import * as MyInfoController from '../myinfo.controller'
import { MyInfoParseRelayStateError } from '../myinfo.errors'
import { MyInfoService } from '../myinfo.service'
import { MyInfoAuthCodeCookieState } from '../myinfo.types'

import {
  MOCK_AUTH_CODE,
  MOCK_FORM_ID,
  MOCK_MYINFO_FORM,
  MOCK_REDIRECT_URL,
} from './myinfo.test.constants'

jest.mock('../myinfo.service')
const MockMyInfoService = jest.mocked(MyInfoService)

jest.mock('../../form/form.service')
const MockFormService = jest.mocked(FormService)

describe('MyInfoController', () => {
  afterEach(() => jest.clearAllMocks())

  describe('handleRedirectURLRequest', () => {
    const mockReq = expressHandler.mockRequest({
      query: {
        formId: MOCK_FORM_ID,
      },
    })
    const mockRes = expressHandler.mockResponse()

    it('should respond with redirect URL when form is valid MyInfo form', async () => {
      MockFormService.retrieveFormById.mockReturnValueOnce(
        okAsync(MOCK_MYINFO_FORM),
      )
      MockMyInfoService.createRedirectURL.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )

      await MyInfoController.respondWithRedirectURL(mockReq, mockRes, jest.fn())

      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_MYINFO_FORM._id,
      )
      expect(MockMyInfoService.createRedirectURL).toHaveBeenCalledWith({
        formEsrvcId: MOCK_MYINFO_FORM.esrvcId,
        formId: MOCK_MYINFO_FORM._id,
        requestedAttributes: MOCK_MYINFO_FORM.getUniqueMyInfoAttrs(),
      })
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 404 when form is not found', async () => {
      MockFormService.retrieveFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      await MyInfoController.respondWithRedirectURL(mockReq, mockRes, jest.fn())

      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_MYINFO_FORM._id,
      )
      expect(MockMyInfoService.createRedirectURL).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
    })

    it('should return 400 when form is not a MyInfo form', async () => {
      MockFormService.retrieveFormById.mockReturnValueOnce(
        okAsync({ ...MOCK_MYINFO_FORM, authType: 'SP' } as IFormSchema),
      )

      await MyInfoController.respondWithRedirectURL(mockReq, mockRes, jest.fn())

      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_MYINFO_FORM._id,
      )
      expect(MockMyInfoService.createRedirectURL).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })

    it('should return 500 when database error occurs', async () => {
      MockFormService.retrieveFormById.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      await MyInfoController.respondWithRedirectURL(mockReq, mockRes, jest.fn())

      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_MYINFO_FORM._id,
      )
      expect(MockMyInfoService.createRedirectURL).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    })
  })

  describe('loginToMyInfo', () => {
    const mockState = {
      formId: MOCK_MYINFO_FORM._id,
      uuid: 'uuid',
    }
    const mockReq = expressHandler.mockRequest({
      query: {
        code: MOCK_AUTH_CODE,
        state: JSON.stringify(mockState),
      },
    })
    const mockRes = expressHandler.mockResponse()

    beforeEach(() => {
      MockMyInfoService.parseMyInfoRelayState.mockReturnValue(ok(mockState))
    })

    it('should set auth code cookie and redirect to correct destination when login is valid', async () => {
      await MyInfoController.loginToMyInfo(mockReq, mockRes, jest.fn())

      expect(mockRes.cookie).toHaveBeenCalledWith(
        MYINFO_AUTH_CODE_COOKIE_NAME,
        {
          authCode: MOCK_AUTH_CODE,
          state: MyInfoAuthCodeCookieState.Success,
        },
        MYINFO_AUTH_CODE_COOKIE_OPTIONS,
      )
      expect(mockRes.redirect).toHaveBeenCalledWith(`/${MOCK_MYINFO_FORM._id}`)
    })

    it('should return 400 when destination is not valid', async () => {
      MockMyInfoService.parseMyInfoRelayState.mockReturnValue(
        err(new MyInfoParseRelayStateError()),
      )

      await MyInfoController.loginToMyInfo(mockReq, mockRes, jest.fn())

      expect(mockRes.cookie).not.toHaveBeenCalled()
      expect(mockRes.redirect).not.toHaveBeenCalled()
      expect(mockRes.sendStatus).toHaveBeenCalledWith(400)
    })

    it('should set error cookie and redirect to form when consent flow is not successful', async () => {
      const mockErrorReq = expressHandler.mockRequest({
        query: {
          error: 'error',
          'error-description': 'error-description',
          state: JSON.stringify(mockState),
        },
      })

      await MyInfoController.loginToMyInfo(mockErrorReq, mockRes, jest.fn())

      expect(mockRes.cookie).toHaveBeenCalledWith(
        MYINFO_AUTH_CODE_COOKIE_NAME,
        {
          state: MyInfoAuthCodeCookieState.Error,
        },
        MYINFO_AUTH_CODE_COOKIE_OPTIONS,
      )
      expect(mockRes.redirect).toHaveBeenCalledWith(`/${MOCK_MYINFO_FORM._id}`)
    })
  })
})
