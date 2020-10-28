import { ObjectId } from 'bson-ext'
import { merge } from 'lodash'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { IPopulatedForm } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import {
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form.errors'
import * as FormService from '../../form.service'
import * as PublicFormController from '../public-form.controller'
import * as PublicFormService from '../public-form.service'
import { Metatags } from '../public-form.types'

jest.mock('../../form.service')
jest.mock('../public-form.service')
const MockFormService = mocked(FormService)
const MockPublicFormService = mocked(PublicFormService)

describe('public-form.controller', () => {
  afterEach(() => jest.clearAllMocks())

  describe('handleSubmitFeedback', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_FORM: Partial<IPopulatedForm> = {
      _id: MOCK_FORM_ID,
      title: 'mock form title',
      inactiveMessage: 'This mock form is mock closed.',
    }
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
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))
      MockPublicFormService.insertFormFeedback.mockReturnValueOnce(
        okAsync(true),
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
        err(new PrivateFormError()),
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
    const EXPECTED_METATAG_ARGS = {
      formId: MOCK_FORM_ID,
      appUrl: `${MOCK_REQ.protocol}://${MOCK_REQ.hostname}${MOCK_REQ.originalUrl}`,
      imageBaseUrl: `${MOCK_REQ.protocol}://${MOCK_REQ.hostname}`,
    }

    it('should return index render with redirectPath when metatags are created successfully', async () => {
      // Arrange
      const mockMetatags: Metatags = {
        title: 'mock tag title',
        appUrl: 'some://mock-app.url',
        images: ['some-image-link-1', 'some-image-link-2'],
        twitterImage: 'some-twitter-link',
        description: 'mock tag description',
      }
      const mockRes = expressHandler.mockResponse()
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        okAsync(mockMetatags),
      )

      // Act
      await PublicFormController.handleRedirect(MOCK_REQ, mockRes, jest.fn())

      // Assert
      const expectedRedirectPath = MOCK_FORM_ID
      expect(MockPublicFormService.createMetatags).toHaveBeenCalledWith(
        EXPECTED_METATAG_ARGS,
      )
      expect(mockRes.render).toHaveBeenCalledWith('index', {
        ...mockMetatags,
        redirectPath: expectedRedirectPath,
      })
    })

    it('should return index render with redirectPath with retained state when metatags are created successfully', async () => {
      // Arrange
      const stateParam = 'use-template' as const
      const mockReqWithState = merge({}, MOCK_REQ, {
        params: { state: stateParam },
      })
      const mockMetatags: Metatags = {
        title: 'mock tag title',
        appUrl: 'some://mock-app.url',
        images: ['some-image-link-1', 'some-image-link-2'],
        twitterImage: 'some-twitter-link',
        description: 'mock tag description',
      }
      const mockRes = expressHandler.mockResponse()
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        okAsync(mockMetatags),
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
        ...mockMetatags,
        redirectPath: expectedRedirectPath,
      })
    })

    it('should return 302 redirect to hashbang fallback when metatag creation fails due to invalid formId', async () => {
      // Arrange
      const stateParam = 'preview' as const
      const mockReqWithState = merge({}, MOCK_REQ, {
        params: { state: stateParam },
      })
      const mockRes = expressHandler.mockResponse()
      // Mock form not found error.
      MockPublicFormService.createMetatags.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      // Act
      await PublicFormController.handleRedirect(
        mockReqWithState,
        mockRes,
        jest.fn(),
      )

      // Assert
      const expectedRedirectPath = `/#!/${MOCK_FORM_ID}/${stateParam}`
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
})
