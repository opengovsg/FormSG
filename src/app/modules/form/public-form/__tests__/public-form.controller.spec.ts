import { IPersonResponse } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson-ext'
import { Request } from 'express'
import { merge } from 'lodash'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import querystring from 'querystring'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { MyInfoData } from 'src/app/modules/myinfo/myinfo.adapter'
import {
  MyInfoCookieAccessError,
  MyInfoFetchError,
  MyInfoMissingAccessTokenError,
} from 'src/app/modules/myinfo/myinfo.errors'
import {
  MyInfoCookieState,
  MyInfoForm,
} from 'src/app/modules/myinfo/myinfo.types'
import { JwtPayload, SpcpForm } from 'src/app/modules/spcp/spcp.types'
import {
  IFormDocument,
  IFormSchema,
  IPopulatedForm,
  IPopulatedUser,
  PublicForm,
} from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { FormAuthType, MyInfoAttribute } from '../../../../../../shared/types'
import * as AuthService from '../../../auth/auth.service'
import { MYINFO_COOKIE_NAME } from '../../../myinfo/myinfo.constants'
import { MyInfoCookieStateError } from '../../../myinfo/myinfo.errors'
import { MyInfoService } from '../../../myinfo/myinfo.service'
import { SGID_COOKIE_NAME } from '../../../sgid/sgid.constants'
import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  LoginPageValidationError,
  MissingJwtError,
} from '../../../spcp/spcp.errors'
import { CpOidcServiceClass } from '../../../spcp/spcp.oidc.service/spcp.oidc.service.cp'
import { SpOidcServiceClass } from '../../../spcp/spcp.oidc.service/spcp.oidc.service.sp'
import { SpcpService } from '../../../spcp/spcp.service'
import { JwtName } from '../../../spcp/spcp.types'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form.errors'
import * as FormService from '../../form.service'
import * as PublicFormController from '../public-form.controller'
import * as PublicFormService from '../public-form.service'
import { Metatags } from '../public-form.types'

jest.mock('../public-form.service')
jest.mock('../../form.service')
jest.mock('../../../auth/auth.service')
jest.mock('../../../spcp/spcp.service')
jest.mock('../../../spcp/spcp.oidc.service/spcp.oidc.service.sp')
jest.mock('../../../spcp/spcp.oidc.service/spcp.oidc.service.cp')
jest.mock('../../../myinfo/myinfo.service')

const MockFormService = mocked(FormService)
const MockPublicFormService = mocked(PublicFormService)
const MockAuthService = mocked(AuthService)
const MockSpcpService = mocked(SpcpService, true)

const MockMyInfoService = mocked(MyInfoService, true)

describe('public-form.controller', () => {
  afterEach(() => jest.clearAllMocks())

  describe('handleRedirect', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_REQ = expressHandler.mockRequest({
      params: { formId: MOCK_FORM_ID },
      others: {
        protocol: 'https',
        hostname: 'mockHostName',
        originalUrl: '/some-url',
      },
    })
    const MOCK_METATAGS: Metatags = {
      title: 'mock tag title',
      appUrl: 'some://mock-app.url',
      images: ['some-image-link-1', 'some-image-link-2'],
      twitterImage: 'some-twitter-link',
      description: 'mock tag description',
    }
    const EXPECTED_METATAG_ARGS = {
      formId: MOCK_FORM_ID,
      appUrl: `${MOCK_REQ.protocol}://${MOCK_REQ.hostname}${MOCK_REQ.originalUrl}`,
      imageBaseUrl: `${MOCK_REQ.protocol}://${MOCK_REQ.hostname}`,
    }

    it('should return index render with redirectPath when metatags are created successfully', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        okAsync(MOCK_METATAGS),
      )

      // Act
      await PublicFormController.handleRedirect(MOCK_REQ, mockRes, jest.fn())

      // Assert
      const expectedRedirectPath = MOCK_FORM_ID
      expect(MockPublicFormService.createMetatags).toHaveBeenCalledWith(
        EXPECTED_METATAG_ARGS,
      )
      expect(mockRes.render).toHaveBeenCalledWith('index', {
        ...MOCK_METATAGS,
        redirectPath: expectedRedirectPath,
      })
    })

    it('should return index render with redirectPath with retained state when metatags are created successfully', async () => {
      // Arrange
      const stateParam = 'use-template' as const
      const mockReqWithState = merge({}, MOCK_REQ, {
        params: { state: stateParam },
      })
      const mockRes = expressHandler.mockResponse()
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        okAsync(MOCK_METATAGS),
      )

      // Act
      await PublicFormController.handleRedirect(
        mockReqWithState,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Should have state param affixed.
      const expectedRedirectPath = `${MOCK_FORM_ID}/${stateParam}`
      expect(MockPublicFormService.createMetatags).toHaveBeenCalledWith(
        EXPECTED_METATAG_ARGS,
      )
      expect(mockRes.render).toHaveBeenCalledWith('index', {
        ...MOCK_METATAGS,
        redirectPath: expectedRedirectPath,
      })
    })

    it('should return index render with redirectPath with retained query when metatags are created successfully', async () => {
      // Arrange
      const mockReqWithQuery = merge({}, MOCK_REQ, {
        query: {
          p1: 'v1-_',
          p2: 'v2',
          p3: ['v3', 'v4'],
        },
      })
      const mockRes = expressHandler.mockResponse()
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        okAsync(MOCK_METATAGS),
      )

      // Act
      await PublicFormController.handleRedirect(
        mockReqWithQuery,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Should have encoded query string affixed.
      const expectedQueryString = encodeURIComponent(
        querystring.stringify(mockReqWithQuery.query),
      )
      const expectedRedirectPath = `${MOCK_FORM_ID}?${expectedQueryString}`
      expect(MockPublicFormService.createMetatags).toHaveBeenCalledWith(
        EXPECTED_METATAG_ARGS,
      )
      expect(mockRes.render).toHaveBeenCalledWith('index', {
        ...MOCK_METATAGS,
        redirectPath: expectedRedirectPath,
      })
    })

    it('should return 302 redirect to hashbang fallback when metatag creation fails due to invalid formId', async () => {
      // Arrange
      const stateParam = 'preview' as const
      const mockReqWithStateAndQuery = merge({}, MOCK_REQ, {
        params: { state: stateParam },
        query: {
          p1: 'v1-_',
          p2: 'v2',
          p3: ['v3', 'v4'],
        },
      })
      const mockRes = expressHandler.mockResponse()
      // Mock form not found error.
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      // Act
      await PublicFormController.handleRedirect(
        mockReqWithStateAndQuery,
        mockRes,
        jest.fn(),
      )

      // Assert
      const expectedQueryString = encodeURIComponent(
        querystring.stringify(mockReqWithStateAndQuery.query),
      )
      const expectedRedirectPath = `/#!/${MOCK_FORM_ID}/${stateParam}?${expectedQueryString}`
      expect(MockPublicFormService.createMetatags).toHaveBeenCalledWith(
        EXPECTED_METATAG_ARGS,
      )
      expect(mockRes.redirect).toHaveBeenCalledWith(expectedRedirectPath)
    })

    it('should return 302 redirect to hashbang fallback when metatag creation fails due to database error', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock database error.
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await PublicFormController.handleRedirect(MOCK_REQ, mockRes, jest.fn())

      // Assert
      const expectedRedirectPath = `/#!/${MOCK_FORM_ID}`
      expect(MockPublicFormService.createMetatags).toHaveBeenCalledWith(
        EXPECTED_METATAG_ARGS,
      )
      expect(mockRes.redirect).toHaveBeenCalledWith(expectedRedirectPath)
    })
  })

  describe('handleGetPublicForm', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_USER_ID = new ObjectId().toHexString()
    const MOCK_USER = {
      _id: MOCK_USER_ID,
      email: 'randomrandomtest@example.com',
    } as IPopulatedUser

    const MOCK_SCRUBBED_FORM = {
      _id: MOCK_FORM_ID,
      title: 'mock title',
      admin: { _id: MOCK_USER_ID },
    } as unknown as PublicForm

    const BASE_FORM = {
      admin: MOCK_USER,
      _id: MOCK_FORM_ID,
      title: MOCK_SCRUBBED_FORM.title,
      getUniqueMyInfoAttrs: jest.fn().mockReturnValue([MyInfoAttribute.Name]),
      getPublicView: jest.fn().mockReturnValue(MOCK_SCRUBBED_FORM),
    }

    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: MOCK_FORM_ID,
      },
    })

    const MOCK_MYINFO_COOKIE = {
      accessToken: 'cookie',
      usedCount: 0,
      state: MyInfoCookieState.Success,
    }

    let mockReqWithCookies: Request<{
      formId: string
    }>

    beforeEach(() => {
      mockReqWithCookies = expressHandler.mockRequest({
        params: {
          formId: MOCK_FORM_ID,
        },
        others: { cookies: { MyInfoCookie: MOCK_MYINFO_COOKIE } },
      })
    })

    // Success
    describe('valid form id', () => {
      const MOCK_JWT_PAYLOAD: JwtPayload = {
        userName: 'mock',
        rememberMe: false,
      }

      beforeAll(() => {
        MockFormService.checkIsIntranetFormAccess.mockReturnValue(false)
      })

      it('should return 200 when there is no FormAuthType on the request', async () => {
        // Arrange
        const MOCK_NIL_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.NIL,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_NIL_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })

      it('should return 200 when client authenticates using SP', async () => {
        // Arrange
        const MOCK_SPCP_SESSION = {
          userName: MOCK_JWT_PAYLOAD.userName,
          exp: 1000000000,
          iat: 100000000,
          rememberMe: false,
        }
        const MOCK_SP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.SP,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )

        jest
          .spyOn(SpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_SP_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
          spcpSession: MOCK_SPCP_SESSION,
        })
      })

      it('should return 200 when client authenticates using CP', async () => {
        // Arrange
        const MOCK_SPCP_SESSION = {
          userName: MOCK_JWT_PAYLOAD.userName,
          exp: 1000000000,
          iat: 100000000,
          rememberMe: false,
        }
        const MOCK_CP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.CP,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        jest
          .spyOn(CpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))
        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_CP_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
          spcpSession: MOCK_SPCP_SESSION,
        })
      })

      it('should return 200 when client authenticates using MyInfo', async () => {
        // Arrange
        const MOCK_MYINFO_AUTH_FORM = {
          ...BASE_FORM,
          esrvcId: 'thing',
          authType: FormAuthType.MyInfo,
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        } as unknown as IPopulatedForm
        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'i am a fish',
        } as IPersonResponse)
        const MOCK_SPCP_SESSION = { userName: MOCK_MYINFO_DATA.getUinFin() }
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        })
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          okAsync([]),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).not.toHaveBeenCalled()
        expect(mockRes.cookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: { ...MOCK_MYINFO_AUTH_FORM.getPublicView(), form_fields: [] },
          spcpSession: MOCK_SPCP_SESSION,
          isIntranetUser: false,
        })
      })
    })

    // Errors
    describe('errors in myInfo', () => {
      const MOCK_MYINFO_FORM = {
        ...BASE_FORM,
        toJSON: jest.fn().mockReturnThis(),
        authType: FormAuthType.MyInfo,
      } as unknown as IPopulatedForm

      // Setup because this gets invoked at the start of the controller to decide which branch to take
      beforeAll(() => {
        MockAuthService.getFormIfPublic.mockReturnValue(
          okAsync(MOCK_MYINFO_FORM),
        )

        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(false)

        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValue(
          okAsync(MOCK_MYINFO_FORM),
        )
      })

      it('should return 200 but the response should have cookies cleared with myInfoError set to undefined when the request has no cookie', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(new MyInfoMissingAccessTokenError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: undefined,
        })
      })

      it('should return 200 but the response should have cookies cleared with myInfoError set to undefined when the cookie has been used before', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(new MyInfoCookieAccessError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: undefined,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the cookie cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(new MyInfoCookieStateError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if the form cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(
            new AuthTypeMismatchError(FormAuthType.MyInfo, FormAuthType.CP),
          ),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          myInfoError: true,
          isIntranetUser: false,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the form has no eservcId', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(new FormAuthNoEsrvcIdError('anything')),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the form could not be filled', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(new MyInfoFetchError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if a database error occurs while saving hashes', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'i am a fish',
        } as IPersonResponse)
        const expected = new DatabaseError('fish error')
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          errAsync(expected),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })
    })

    describe('errors in spcp', () => {
      const MOCK_SP_FORM = {
        ...BASE_FORM,
        authType: FormAuthType.SP,
      } as unknown as IPopulatedForm
      const MOCK_CP_FORM = {
        ...BASE_FORM,
        authType: FormAuthType.CP,
      } as unknown as IPopulatedForm
      it('should return 200 with the form but without a spcpSession when the JWT token could not be found for SP form', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_FORM),
        )
        jest
          .spyOn(SpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(errAsync(new MissingJwtError()))

        // Act
        // 2. GET the endpoint
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // Status should be 200
        // json object should only have form property
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_SP_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })

      it('should return 200 with the form but without a spcpSession when the JWT token could not be found for CP form', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_FORM),
        )
        jest
          .spyOn(CpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(errAsync(new MissingJwtError()))

        // Act
        // 2. GET the endpoint
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // Status should be 200
        // json object should only have form property
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_CP_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })
    })

    describe('errors in form retrieval', () => {
      const MOCK_ERROR_STRING = 'mockingbird'

      it('should return 500 when a database error occurs', async () => {
        // Arrange
        // 1. Mock the response
        const mockRes = expressHandler.mockResponse()

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new DatabaseError(MOCK_ERROR_STRING)),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // 1. Check args of mocked services
        expect(MockAuthService.getFormIfPublic).toHaveBeenCalledWith(
          MOCK_FORM_ID,
        )
        // 2. Check that error is correct
        expect(
          MockFormService.checkFormSubmissionLimitAndDeactivateForm,
        ).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          message: MOCK_ERROR_STRING,
        })
      })

      it('should return 404 when the form is not found', async () => {
        // Arrange
        // 1. Mock the response
        const mockRes = expressHandler.mockResponse()
        const MOCK_ERROR_STRING = 'Your form was eaten up by a monster'

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new FormNotFoundError(MOCK_ERROR_STRING)),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // 1. Check args of mocked services
        expect(MockAuthService.getFormIfPublic).toHaveBeenCalledWith(
          MOCK_FORM_ID,
        )
        // 2. Check that error is correct
        expect(
          MockFormService.checkFormSubmissionLimitAndDeactivateForm,
        ).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(404)
        expect(mockRes.json).toHaveBeenCalledWith({
          message: MOCK_ERROR_STRING,
        })
      })

      it('should return 404 when the form is private and not accessible by the public', async () => {
        // Arrange
        // 1. Mock the response
        const mockRes = expressHandler.mockResponse()
        const MOCK_FORM_TITLE = 'private form'

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new PrivateFormError(MOCK_ERROR_STRING, MOCK_FORM_TITLE)),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // 1. Check args of mocked services
        expect(MockAuthService.getFormIfPublic).toHaveBeenCalledWith(
          MOCK_FORM_ID,
        )
        // 2. Check that error is correct
        expect(
          MockFormService.checkFormSubmissionLimitAndDeactivateForm,
        ).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(404)
        expect(mockRes.json).toHaveBeenCalledWith({
          message: MOCK_ERROR_STRING,
          formTitle: MOCK_FORM_TITLE,
          isPageFound: true,
        })
      })
    })

    describe('errors in form access', () => {
      const MOCK_SPCP_SESSION = {
        userName: 'mock',
        exp: 1000000000,
        iat: 100000000,
        rememberMe: false,
      }

      it('should return 200 with isIntranetUser set to false when a user accesses a form from outside intranet', async () => {
        // Arrange
        const MOCK_NIL_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.NIL,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(false)

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_NIL_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })

      it('should return 200 with isIntranetUser set to true when a intranet user accesses an FormAuthType.SP form', async () => {
        // Arrange
        const MOCK_SP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.SP,
        } as unknown as IPopulatedForm

        const mockRes = expressHandler.mockResponse()

        jest
          .spyOn(SpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))
        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(true)
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_SP_AUTH_FORM.getPublicView(),
          spcpSession: MOCK_SPCP_SESSION,
          isIntranetUser: true,
        })
      })

      it('should return 200 with isIntranetUser set to true when a intranet user accesses an FormAuthType.CP form', async () => {
        // Arrange
        const MOCK_CP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.CP,
        } as unknown as IPopulatedForm

        const mockRes = expressHandler.mockResponse()

        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(true)
        jest
          .spyOn(CpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_CP_AUTH_FORM.getPublicView(),
          spcpSession: MOCK_SPCP_SESSION,
          isIntranetUser: true,
        })
      })

      it('should return 200 with isIntranetUser set to true when a intranet user accesses an FormAuthType.MyInfo form', async () => {
        // Arrange
        const MOCK_MYINFO_AUTH_FORM = {
          ...BASE_FORM,
          esrvcId: 'thing',
          authType: FormAuthType.MyInfo,
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        })

        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'i am a fish',
        } as IPersonResponse)

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(true)
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          okAsync([]),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).not.toHaveBeenCalled()
        expect(mockRes.cookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: { ...MOCK_MYINFO_AUTH_FORM.getPublicView(), form_fields: [] },
          spcpSession: { userName: MOCK_MYINFO_DATA.getUinFin() },
          isIntranetUser: true,
        })
      })
    })
  })

  describe('_handleFormAuthRedirect', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: new ObjectId().toHexString(),
      },
      query: {
        isPersistentLogin: true,
      },
    })
    const MOCK_REDIRECT_URL = 'www.mockata.com'

    it('should return 200 with the redirect url when the request is valid and the form has authType SP', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValueOnce(ok(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid, form has authType SP and isPersistentLogin is undefined', async () => {
      // Arrange
      const MOCK_REQ_WITHOUT_PERSISTENT_LOGIN = expressHandler.mockRequest({
        params: {
          formId: new ObjectId().toHexString(),
        },
      })
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValueOnce(ok(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ_WITHOUT_PERSISTENT_LOGIN,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid, form has authType SP and isPersistentLogin is false', async () => {
      // Arrange
      const MOCK_REQ_WITH_FALSE_PERSISTENT_LOGIN = expressHandler.mockRequest({
        params: {
          formId: new ObjectId().toHexString(),
        },
        query: {
          isPersistentLogin: false,
        },
      })
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValueOnce(ok(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ_WITH_FALSE_PERSISTENT_LOGIN,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid and the form has authType CP', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.CP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(CpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockReturnValueOnce(okAsync(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid and the form has authType MyInfo', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.MyInfo,
        esrvcId: '12345',
        getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
      } as unknown as MyInfoForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      MockMyInfoService.createRedirectURL.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 400 when the form has authType NIL', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.NIL,
        esrvcId: '12345',
      } as IFormDocument

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      })
    })

    it('should return 400 when the form has authType MyInfo and is missing esrvcId', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.MyInfo,
      } as unknown as MyInfoForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })
    })

    it('should return 400 when the form has authType SP and is missing esrvcId', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })
    })

    it('should return 400 when the form has authType CP and is missing esrvcId', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.CP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })
    })

    it('should return 500 when the form could not be retrieved from the database', async () => {
      // Arrange

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })

    it('should return 500 when the redirectURL could not be created for SP form', async () => {
      // Arrange
      const MOCK_FORM = {
        esrvcId: '234',
        authType: FormAuthType.SP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValue(err(new CreateRedirectUrlError()))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })

    it('should return 500 when the redirectURL could not be created for CP form', async () => {
      // Arrange
      const MOCK_FORM = {
        esrvcId: '234',
        authType: FormAuthType.CP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(CpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockReturnValueOnce(errAsync(new CreateRedirectUrlError()))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })
  })

  describe('handlePublicAuthLogout', () => {
    it('should return 200 if authType is SP and call clearCookie()', async () => {
      const authType = FormAuthType.SP as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        JwtName[authType],
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(JwtName[authType])
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })

    it('should return 200 if authType is CP and call clearCookie()', async () => {
      const authType = FormAuthType.CP as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        JwtName[authType],
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(JwtName[authType])
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })

    it('should return 200 if authType is MyInfo and call clearCookie()', async () => {
      const authType = FormAuthType.MyInfo as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        MYINFO_COOKIE_NAME,
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(MYINFO_COOKIE_NAME)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })

    it('should return 200 if authType is SGID and call clearCookie()', async () => {
      const authType = FormAuthType.SGID as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        SGID_COOKIE_NAME,
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(SGID_COOKIE_NAME)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })
  })

  describe('handleValidateFormEsrvcId', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: new ObjectId().toHexString(),
      },
    })
    const MOCK_REDIRECT_URL = 'www.mockata.com'

    it('should return 200 with isValid set to true when a valid MyInfo form authenticates successfully', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.MyInfo,
        esrvcId: '12345',
      } as MyInfoForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedResBody = { isValid: true as const }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))
      MockSpcpService.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpService.fetchLoginPage.mockReturnValueOnce(
        okAsync('this is raw html'),
      )
      MockSpcpService.validateLoginPage.mockReturnValueOnce(ok(expectedResBody))

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResBody)
    })

    it('should return 200 with isValid set to true when a valid SP form authenticates successfully', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedResBody = { isValid: true as const }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))
      MockSpcpService.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpService.fetchLoginPage.mockReturnValueOnce(
        okAsync('this is raw html'),
      )
      MockSpcpService.validateLoginPage.mockReturnValueOnce(ok(expectedResBody))

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResBody)
    })
    it('should return 200 with isValid set to false when an invalid MyInfo form authenticates successfully', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.MyInfo,
        esrvcId: '12345',
      } as MyInfoForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedResBody = { isValid: false, errorCode: '138' }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))
      MockSpcpService.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpService.fetchLoginPage.mockReturnValueOnce(
        okAsync('this is raw html'),
      )
      MockSpcpService.validateLoginPage.mockReturnValueOnce(ok(expectedResBody))

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResBody)
    })

    it('should return 200 with isValid set to false when an invalid SP form authenticates successfully', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedResBody = { isValid: false, errorCode: '138' }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))
      MockSpcpService.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpService.fetchLoginPage.mockReturnValueOnce(
        okAsync('this is raw html'),
      )
      MockSpcpService.validateLoginPage.mockReturnValueOnce(ok(expectedResBody))

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResBody)
    })

    it('should return 400 when the form has authType.NIL', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.NIL,
        esrvcId: '12345',
      } as IFormSchema
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })

    it('should return 400 when the form has authType.CP', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.CP,
        esrvcId: '12345',
      } as IFormSchema
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })

    it('should return 400 when the form does not have an eServiceId', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
      } as SpcpForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })

    it('should return 404 when there is no form with the given formId', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message:
          'Could not find the form requested. Please refresh and try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })

    it('should return 500 when the returned html has no title', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message: 'Error while contacting SingPass. Please try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))
      MockSpcpService.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpService.fetchLoginPage.mockReturnValue(okAsync(''))
      MockSpcpService.validateLoginPage.mockReturnValueOnce(
        err(new LoginPageValidationError()),
      )

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(502)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })

    it('should return 500 when a database error occurs', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message: 'Sorry, something went wrong. Please try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })

    it('should return 500 when the redirect url could not be generated', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message: 'Sorry, something went wrong. Please try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))
      MockSpcpService.createRedirectUrl.mockReturnValueOnce(
        err(new CreateRedirectUrlError()),
      )

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })

    it('should return 503 when the login page for the form could not be retrieved', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormSchema>
      const mockRes = expressHandler.mockResponse()
      const expectedError = {
        message: 'Failed to contact SingPass. Please try again.',
      }
      MockFormService.retrieveFormById.mockReturnValueOnce(okAsync(MOCK_FORM))
      MockSpcpService.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )
      MockSpcpService.fetchLoginPage.mockReturnValue(
        errAsync(new FetchLoginPageError()),
      )

      // Act
      await PublicFormController.handleValidateFormEsrvcId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(503)
      expect(mockRes.json).toHaveBeenCalledWith(expectedError)
    })
  })
})
