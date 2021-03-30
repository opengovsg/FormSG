import { IPersonResponse } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson-ext'
import { merge } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import querystring from 'querystring'
import { MockedObject } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import {
  DatabaseError,
  MissingFeatureError,
} from 'src/app/modules/core/core.errors'
import { MyInfoData } from 'src/app/modules/myinfo/myinfo.adapter'
import {
  MyInfoAuthTypeError,
  MyInfoMissingAccessTokenError,
  MyInfoNoESrvcIdError,
} from 'src/app/modules/myinfo/myinfo.errors'
import { MyInfoCookieState } from 'src/app/modules/myinfo/myinfo.types'
import { JwtPayload } from 'src/app/modules/spcp/spcp.types'
import { FeatureNames } from 'src/config/feature-manager/types'
import {
  AuthType,
  IPopulatedForm,
  IPopulatedUser,
  MyInfoAttribute,
  PublicForm,
} from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import * as AuthService from '../../../auth/auth.service'
import { MyInfoCookieStateError } from '../../../myinfo/myinfo.errors'
import { MyInfoFactory } from '../../../myinfo/myinfo.factory'
import { MissingJwtError } from '../../../spcp/spcp.errors'
import { SpcpFactory } from '../../../spcp/spcp.factory'
import {
  FormDeletedError,
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
jest.mock('../../../spcp/spcp.factory')
jest.mock('../../../myinfo/myinfo.factory')

const MockFormService = mocked(FormService)
const MockPublicFormService = mocked(PublicFormService)
const MockAuthService = mocked(AuthService)
const MockSpcpFactory = mocked(SpcpFactory, true)
const MockMyInfoFactory = mocked(MyInfoFactory, true)

const FormFeedbackModel = getFormFeedbackModel(mongoose)

describe('public-form.controller', () => {
  afterEach(() => jest.clearAllMocks())

  describe('handleSubmitFeedback', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_FORM = {
      _id: MOCK_FORM_ID,
      title: 'mock form title',
      inactiveMessage: 'This mock form is mock closed.',
    } as IPopulatedForm
    const MOCK_REQ = expressHandler.mockRequest({
      body: {
        rating: 4,
        comment: 'good',
      },
      params: {
        formId: MOCK_FORM_ID,
      },
    })

    it('should return 200 when feedback is saved successfully', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      // Mock services to return success.
      const mockFormFeedback = new FormFeedbackModel({
        formId: new ObjectId().toHexString(),
        rating: 5,
        comment: 'Great test',
      })
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))
      MockPublicFormService.insertFormFeedback.mockReturnValueOnce(
        okAsync(mockFormFeedback),
      )

      // Act
      await PublicFormController.handleSubmitFeedback(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check args of mocked services.
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockFormService.isFormPublic).toHaveBeenCalledWith(MOCK_FORM)
      expect(MockPublicFormService.insertFormFeedback).toHaveBeenCalledWith({
        formId: MOCK_REQ.params.formId,
        rating: MOCK_REQ.body.rating,
        comment: MOCK_REQ.body.comment,
      })
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully submitted feedback',
      })
    })

    it('should return 404 when retrieving form results in FormNotFoundError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      // Mock retrieval of form to return failure.
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      // Act
      await PublicFormController.handleSubmitFeedback(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check args of mocked services.
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockFormService.isFormPublic).not.toHaveBeenCalled()
      expect(MockPublicFormService.insertFormFeedback).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Form not found',
      })
    })

    it('should return 404 when checking form status results in PrivateFormError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      // Mock services to return correct mock states.
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      // Mock return error.
      MockFormService.isFormPublic.mockReturnValueOnce(
        err(new PrivateFormError(MOCK_FORM.inactiveMessage, MOCK_FORM.title)),
      )

      // Act
      await PublicFormController.handleSubmitFeedback(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check args of mocked services.
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockFormService.isFormPublic).toHaveBeenCalledWith(MOCK_FORM)
      expect(MockPublicFormService.insertFormFeedback).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: MOCK_FORM.inactiveMessage,
        isPageFound: true,
        formTitle: MOCK_FORM.title,
      })
    })

    it('should return 410 when checking form status results in FormDeletedError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      // Mock services to return correct mock states.
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      // Mock return error.
      MockFormService.isFormPublic.mockReturnValueOnce(
        err(new FormDeletedError()),
      )

      // Act
      await PublicFormController.handleSubmitFeedback(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check args of mocked services.
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockFormService.isFormPublic).toHaveBeenCalledWith(MOCK_FORM)
      expect(MockPublicFormService.insertFormFeedback).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(410)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Gone' })
    })

    it('should return 500 when databse errors occur', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'Form feedback could not be created'

      // Mock services to return success or failure states.
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))
      // Mock database error.
      MockPublicFormService.insertFormFeedback.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await PublicFormController.handleSubmitFeedback(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check args of mocked services.
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockFormService.isFormPublic).toHaveBeenCalledWith(MOCK_FORM)
      expect(MockPublicFormService.insertFormFeedback).toHaveBeenCalledWith({
        formId: MOCK_REQ.params.formId,
        rating: MOCK_REQ.body.rating,
        comment: MOCK_REQ.body.comment,
      })
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
    })
  })

  describe('handleRedirect', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_REQ = expressHandler.mockRequest({
      params: { Id: MOCK_FORM_ID },
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

    const MOCK_SCRUBBED_FORM = ({
      _id: MOCK_FORM_ID,
      title: 'mock title',
      admin: { _id: MOCK_USER_ID },
    } as unknown) as PublicForm

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

    let MOCK_REQ_WITH_COOKIES: ReturnType<typeof expressHandler.mockRequest>

    beforeEach(() => {
      MOCK_REQ_WITH_COOKIES = expressHandler.mockRequest({
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
        MockFormService.setIsIntranetFormAccess.mockImplementation(
          (_, publicForm) => ok({ ...publicForm, isIntranetUser: false }),
        )

        MockFormService.setMyInfoError.mockImplementation((publicForm) =>
          ok({ ...publicForm, myInfoError: false }),
        )
      })

      it('should return 200 when there is no AuthType on the request', async () => {
        // Arrange
        const MOCK_NIL_AUTH_FORM = (mocked({
          ...BASE_FORM,
          authType: AuthType.NIL,
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_NIL_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: false,
        })
      })

      it('should return 200 when client authenticates using SP', async () => {
        // Arrange
        const MOCK_SP_AUTH_FORM = (mocked({
          ...BASE_FORM,
          authType: AuthType.SP,
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse()

        MockSpcpFactory.createFormWithSpcpSession.mockReturnValueOnce(
          okAsync({
            form: MOCK_SP_AUTH_FORM.getPublicView(),
            spcpSession: { userName: MOCK_JWT_PAYLOAD.userName },
          }),
        )

        MockSpcpFactory.getSpcpSession.mockReturnValueOnce(
          okAsync(MOCK_JWT_PAYLOAD),
        )
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_SP_AUTH_FORM.getPublicView(),
          spcpSession: {
            userName: MOCK_JWT_PAYLOAD.userName,
          },
          isIntranetUser: false,
          myInfoError: false,
        })
      })

      it('should return 200 when client authenticates using CP', async () => {
        // Arrange
        const MOCK_CP_AUTH_FORM = (mocked({
          ...BASE_FORM,
          authType: AuthType.CP,
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse()

        MockSpcpFactory.createFormWithSpcpSession.mockReturnValueOnce(
          okAsync({
            form: MOCK_CP_AUTH_FORM.getPublicView(),
            spcpSession: { userName: MOCK_JWT_PAYLOAD.userName },
          }),
        )

        MockSpcpFactory.getSpcpSession.mockReturnValueOnce(
          okAsync(MOCK_JWT_PAYLOAD),
        )
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_CP_AUTH_FORM.getPublicView(),
          spcpSession: {
            userName: MOCK_JWT_PAYLOAD.userName,
          },
          isIntranetUser: false,
          myInfoError: false,
        })
      })

      it('should return 200 when client authenticates using MyInfo', async () => {
        // Arrange
        const MOCK_MYINFO_AUTH_FORM = (mocked({
          ...BASE_FORM,
          esrvcId: 'thing',
          authType: AuthType.MyInfo,
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
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
        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          okAsync({
            form: MOCK_MYINFO_AUTH_FORM.getPublicView(),
            spcpSession: { userName: MOCK_MYINFO_DATA.getUinFin() },
          }),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ_WITH_COOKIES,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).not.toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_AUTH_FORM.getPublicView(),
          spcpSession: { userName: MOCK_MYINFO_DATA.getUinFin() },
          isIntranetUser: false,
          myInfoError: false,
        })
      })
    })

    // Errors
    describe('errors in myInfo', () => {
      const MOCK_MYINFO_FORM = (mocked({
        ...BASE_FORM,
        authType: AuthType.MyInfo,
      }) as unknown) as IPopulatedForm

      // Setup because this gets invoked at the start of the controller to decide which branch to take
      beforeAll(() => {
        MockAuthService.getFormIfPublic.mockReturnValue(
          okAsync(MOCK_MYINFO_FORM),
        )

        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValue(
          okAsync(MOCK_MYINFO_FORM),
        )
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the request has no cookie', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          errAsync(new MyInfoMissingAccessTokenError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          myInfoError: true,
          isIntranetUser: false,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the cookie cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          errAsync(new MyInfoCookieStateError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ_WITH_COOKIES,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if the form cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          errAsync(new MyInfoAuthTypeError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ_WITH_COOKIES,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the form has no eservcId', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          errAsync(new MyInfoNoESrvcIdError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ_WITH_COOKIES,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the form could not be filled', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          errAsync(
            new MissingFeatureError(
              'testing is the missing feature' as FeatureNames,
            ),
          ),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ_WITH_COOKIES,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if a database error occurs while saving hashes', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_FORM),
        )
        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          errAsync(new DatabaseError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ_WITH_COOKIES,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: true,
        })
      })
    })

    describe('errors in spcp', () => {
      const MOCK_SPCP_FORM = (mocked({
        ...BASE_FORM,
        authType: AuthType.SP,
      }) as unknown) as MockedObject<IPopulatedForm>
      it('should return 200 with the form but without a spcpSession when the JWT token could not be found', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SPCP_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SPCP_FORM),
        )
        MockSpcpFactory.createFormWithSpcpSession.mockReturnValueOnce(
          errAsync(new MissingJwtError()),
        )

        // Act
        // 2. GET the endpoint
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        // Status should be 200
        // json object should only have form property
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_SPCP_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: false,
        })
      })
    })

    describe('errors in form retrieval', () => {
      it('should return 500 when a database error occurs', async () => {
        // Arrange
        // 1. Mock the response
        const MOCK_RES = expressHandler.mockResponse()

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new DatabaseError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
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
        expect(MOCK_RES.status).toHaveBeenCalledWith(500)
      })

      it('should return 404 when the form is not found', async () => {
        // Arrange
        // 1. Mock the response
        const MOCK_RES = expressHandler.mockResponse()

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new FormNotFoundError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
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
        expect(MOCK_RES.status).toHaveBeenCalledWith(404)
      })

      it('should return 404 when the form is private and not accessible by the public', async () => {
        // Arrange
        // 1. Mock the response
        const MOCK_RES = expressHandler.mockResponse()

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(
            new PrivateFormError('teehee this form is private', 'private form'),
          ),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
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
        expect(MOCK_RES.status).toHaveBeenCalledWith(404)
      })
    })

    describe('errors in form access', () => {
      const MOCK_JWT_PAYLOAD: JwtPayload = {
        userName: 'mock',
        rememberMe: false,
      }

      beforeAll(() => {
        MockFormService.setMyInfoError.mockImplementation((publicForm) =>
          ok({ ...publicForm, myInfoError: false }),
        )
      })

      it('should return 200 with isIntranetUser set to false when a user accesses the form with no authType set', async () => {
        // Arrange
        const MOCK_NIL_AUTH_FORM = (mocked({
          ...BASE_FORM,
          authType: AuthType.NIL,
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )

        MockFormService.setIsIntranetFormAccess.mockImplementation(
          (_, publicForm) => ok({ ...publicForm, isIntranetUser: false }),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_NIL_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
          myInfoError: false,
        })
      })

      it('should return 200 with isIntranetUser set to true when a user accesses the form using SP', async () => {
        // Arrange
        const MOCK_SP_AUTH_FORM = (mocked({
          ...BASE_FORM,
          authType: AuthType.SP,
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse()

        MockSpcpFactory.createFormWithSpcpSession.mockReturnValueOnce(
          okAsync({
            form: MOCK_SP_AUTH_FORM.getPublicView(),
            spcpSession: { userName: MOCK_JWT_PAYLOAD.userName },
          }),
        )

        MockFormService.setIsIntranetFormAccess.mockImplementation(
          (_, publicForm) => ok({ ...publicForm, isIntranetUser: true }),
        )

        MockSpcpFactory.getSpcpSession.mockReturnValueOnce(
          okAsync(MOCK_JWT_PAYLOAD),
        )
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_SP_AUTH_FORM.getPublicView(),
          spcpSession: {
            userName: MOCK_JWT_PAYLOAD.userName,
          },
          isIntranetUser: true,
          myInfoError: false,
        })
      })

      it('should return 200 with isIntranetUser set to true when a user accesses the form using CP', async () => {
        // Arrange
        const MOCK_CP_AUTH_FORM = (mocked({
          ...BASE_FORM,
          authType: AuthType.CP,
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse()

        MockSpcpFactory.createFormWithSpcpSession.mockReturnValueOnce(
          okAsync({
            form: MOCK_CP_AUTH_FORM.getPublicView(),
            spcpSession: { userName: MOCK_JWT_PAYLOAD.userName },
          }),
        )

        MockFormService.setIsIntranetFormAccess.mockImplementation(
          (_, publicForm) => ok({ ...publicForm, isIntranetUser: true }),
        )

        MockSpcpFactory.getSpcpSession.mockReturnValueOnce(
          okAsync(MOCK_JWT_PAYLOAD),
        )
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_CP_AUTH_FORM.getPublicView(),
          spcpSession: {
            userName: MOCK_JWT_PAYLOAD.userName,
          },
          isIntranetUser: true,
          myInfoError: false,
        })
      })

      it('should return 200 with isIntranetUser set to true when a user accesses the form using MyInfo', async () => {
        // Arrange
        const MOCK_MYINFO_AUTH_FORM = (mocked({
          ...BASE_FORM,
          esrvcId: 'thing',
          authType: AuthType.MyInfo,
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        }) as unknown) as MockedObject<IPopulatedForm>
        const MOCK_RES = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
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
        MockMyInfoFactory.createFormWithMyInfo.mockReturnValueOnce(
          okAsync({
            form: MOCK_MYINFO_AUTH_FORM.getPublicView(),
            spcpSession: { userName: MOCK_MYINFO_DATA.getUinFin() },
          }),
        )
        MockFormService.setIsIntranetFormAccess.mockImplementation(
          (_, publicForm) => ok({ ...publicForm, isIntranetUser: true }),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ_WITH_COOKIES,
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).not.toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_AUTH_FORM.getPublicView(),
          spcpSession: { userName: MOCK_MYINFO_DATA.getUinFin() },
          isIntranetUser: true,
          myInfoError: false,
        })
      })
    })
  })
})
