import { ObjectId } from 'bson-ext'
import { merge } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import querystring from 'querystring'
import { mocked } from 'ts-jest/utils'

import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { IPopulatedForm } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import * as AuthService from '../../../auth/auth.service'
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
const MockFormService = mocked(FormService)
const MockPublicFormService = mocked(PublicFormService)
const MockAuthService = mocked(AuthService)

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
    // Arrange variables that are shared throughout the test suite
    const MOCK_FORM_ID = new ObjectId().toHexString()
    // const MOCK_SUCCESSFUL_FORM = {
    //   _id: MOCK_FORM_ID,
    //   title: 'mock form title',
    //   inactiveMessage: 'This mock form is mock closed.',
    // } as IPopulatedForm

    // Success goes here

    // Failed errors
    // TODO: this should be grouped together under the same class of errors
    it('should return 500 if the form does not exist', async () => {
      // Arrange
      // 1. Mock the request
      const MOCK_REQ = expressHandler.mockRequest({
        params: {
          formId: MOCK_FORM_ID,
        },
      })

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
      expect(MockAuthService.getFormIfPublic).toHaveBeenCalledWith(MOCK_FORM_ID)
      // 2. Check that error is correct
      expect(
        MockFormService.checkFormSubmissionLimitAndDeactivateForm,
      ).not.toHaveBeenCalled()
      expect(MOCK_RES.status).toHaveBeenCalledWith(500)
    })
  })
})
