import { ObjectId } from 'bson-ext'
import { MyInfoNoESrvcIdError } from 'dist/backend/app/modules/myinfo/myinfo.errors'
import _, { merge } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import querystring from 'querystring'
import { MockedObject } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { MyInfoCookieState } from 'src/app/modules/myinfo/myinfo.types'
import * as myInfoUtils from 'src/app/modules/myinfo/myinfo.util'
import {
  AuthType,
  IPopulatedForm,
  IPopulatedUser,
  MyInfoAttribute,
  PublicForm,
} from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import * as AuthService from '../../../auth/auth.service'
import {
  MyInfoCookieStateError,
  MyInfoMissingAccessTokenError,
} from '../../../myinfo/myinfo.errors'
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

// Mocking services that tests are dependent on
jest.mock('../public-form.service')
jest.mock('../../form.service')
jest.mock('../../../auth/auth.service')
jest.mock('../../../spcp/spcp.factory')
jest.mock('src/app/modules/myinfo/myinfo.util')

const MockFormService = mocked(FormService)
const MockPublicFormService = mocked(PublicFormService)
const MockAuthService = mocked(AuthService)
const MockSpcpFactory = mocked(SpcpFactory)
const MockMyInfoUtils = mocked(myInfoUtils)

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
    // TODO: add tests for logging for spcp to ensure it's only called once
    // TODO: ensure that saveMyInfoHashes is being called
    // Arrange variables that are shared throughout the test suite
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

    const MOCK_FORM = (mocked({
      admin: MOCK_USER,
      _id: MOCK_FORM_ID,
      title: 'Mock',
      getPublicView: jest.fn().mockResolvedValue(MOCK_SCRUBBED_FORM),
    }) as unknown) as MockedObject<IPopulatedForm>

    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: MOCK_FORM_ID,
      },
    })

    // Success

    // Errors
    describe('errors in myInfo', () => {
      // Setup because this gets invoked at the start of the controller to decide which branch to take
      const MOCK_MYINFO_FORM = (_(MOCK_FORM)
        .set('authType', AuthType.MyInfo)
        .set(
          'getUniqueMyInfoAttrs',
          jest.fn().mockReturnValue([MyInfoAttribute.Name]),
        )
        .value() as unknown) as MockedObject<IPopulatedForm>

      MockAuthService.getFormIfPublic.mockReturnValue(okAsync(MOCK_MYINFO_FORM))
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValue(
        okAsync(MOCK_MYINFO_FORM),
      )

      it('should return 200 but the response should have cookies cleared and myInfoError if the request has no cookie', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse()
        const MOCK_CLEAR_COOKIE = jest.fn().mockReturnValueOnce(MOCK_RES)
        // NOTE: This is done because the calls to .json and .clearCookie are chained
        MOCK_RES.clearCookie = MOCK_CLEAR_COOKIE
        MockMyInfoUtils.extractMyInfoCookie.mockReturnValueOnce(
          err(new MyInfoMissingAccessTokenError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          _.set(MOCK_REQ, 'cookies', {}),
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_FORM.getPublicView(),
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if the cookie cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse()
        const MOCK_CLEAR_COOKIE = jest.fn().mockReturnValueOnce(MOCK_RES)
        MOCK_RES.clearCookie = MOCK_CLEAR_COOKIE
        MockMyInfoUtils.extractMyInfoCookie.mockReturnValueOnce(
          ok({ state: MyInfoCookieState.Error }),
        )
        MockMyInfoUtils.extractSuccessfulCookie.mockReturnValueOnce(
          err(new MyInfoCookieStateError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          _.set(MOCK_REQ, 'cookies', { accessToken: 'cookie monster?' }),
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_FORM.getPublicView(),
          myInfoError: true,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if the form cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse()
        const MOCK_CLEAR_COOKIE = jest.fn().mockReturnValueOnce(MOCK_RES)
        MOCK_RES.clearCookie = MOCK_CLEAR_COOKIE
        MockMyInfoUtils.extractMyInfoCookie.mockReturnValueOnce(
          ok({ state: MyInfoCookieState.Error }),
        )
        MockMyInfoUtils.extractSuccessfulCookie.mockReturnValueOnce(
          err(new MyInfoCookieStateError()),
        )
        MockMyInfoUtils.validateMyInfoForm.mockReturnValueOnce(
          err(new MyInfoNoESrvcIdError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          _.set(MOCK_REQ, 'cookies', { accessToken: 'cookie monster?' }),
          MOCK_RES,
          jest.fn(),
        )

        // Assert
        expect(MOCK_RES.clearCookie).toHaveBeenCalled()
        expect(MOCK_RES.json).toHaveBeenCalledWith({
          form: MOCK_FORM.getPublicView(),
          myInfoError: true,
        })
      })
    })

    describe('errors in spcp', () => {
      it('should return 200 with the form but without a spcpSession', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_RES = expressHandler.mockResponse()
        const MOCK_SPCP_FORM = _.set(MOCK_FORM, 'authType', AuthType.SP)

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SPCP_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SPCP_FORM),
        )
        MockSpcpFactory.getSpcpSession.mockReturnValueOnce(
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
        })
      })
    })

    describe('errors in form retrieval', () => {
      it('should return 500 if a database error occurs', async () => {
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

      it('should return 404 if the form is not found', async () => {
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

      it('should return 404 if the form is private and not accessible by the public', async () => {
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
  })
})
