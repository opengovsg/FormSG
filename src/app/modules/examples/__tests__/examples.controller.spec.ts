import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { FormColorTheme } from '../../../../../shared/types'
import { DatabaseError } from '../../core/core.errors'
import * as ExamplesController from '../examples.controller'
import { ResultsNotFoundError } from '../examples.errors'
import * as ExamplesService from '../examples.service'
import { ExamplesQueryParams, SingleFormResult } from '../examples.types'

jest.mock('../examples.service')
const MockExamplesService = mocked(ExamplesService)

describe('examples.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleGetExamples', () => {
    const MOCK_REQ_QUERY: ExamplesQueryParams = {
      pageNo: 1,
    }
    const MOCK_REQ = expressHandler.mockRequest({
      query: MOCK_REQ_QUERY,
      session: {
        user: {
          _id: 'some mock id',
        },
      },
    })

    it('should return 200 with an array of example forms', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getExampleForms to return error.
      const mockResult = {
        forms: [],
        totalNumResults: 0,
      }
      MockExamplesService.getExampleForms.mockReturnValueOnce(
        okAsync(mockResult),
      )

      // Act
      await ExamplesController._handleGetExamples(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(MockExamplesService.getExampleForms).toHaveBeenCalledWith(
        MOCK_REQ_QUERY,
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockResult)
    })

    it('should return 500 when error occurs whilst retrieving example forms', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getExampleForms to return error.
      MockExamplesService.getExampleForms.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await ExamplesController._handleGetExamples(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(MockExamplesService.getExampleForms).toHaveBeenCalledWith(
        MOCK_REQ_QUERY,
      )
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error retrieving example forms',
      })
    })
  })

  describe('handleGetExampleByFormId', () => {
    const MOCK_REQ_PARAMS = {
      formId: 'mockId',
    }
    const MOCK_REQ = expressHandler.mockRequest({
      params: MOCK_REQ_PARAMS,
      session: {
        user: {
          _id: 'some mock id',
        },
      },
    })

    it('should return 200 with the retrieved form example', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getSingleExampleForm to return mock success result.
      const mockResult: SingleFormResult = {
        form: {
          _id: 'mock randomId',
          agency: 'mock agencyId',
          avgFeedback: 5,
          colorTheme: FormColorTheme.Blue,
          count: 20,
          form_fields: [],
          lastSubmission: new Date(),
          logo: 'logo',
          timeText: 'now',
          title: 'mockTitle',
        },
      }
      MockExamplesService.getSingleExampleForm.mockReturnValueOnce(
        okAsync(mockResult),
      )

      // Act
      await ExamplesController.handleGetExampleByFormId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockExamplesService.getSingleExampleForm).toHaveBeenCalledWith(
        MOCK_REQ_PARAMS.formId,
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockResult)
    })

    it('should return 404 when the form with given formId does not exist in the database', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getSingleExampleForm to return not found error.
      const mockErrorString = 'not found error!'
      MockExamplesService.getSingleExampleForm.mockReturnValueOnce(
        errAsync(new ResultsNotFoundError(mockErrorString)),
      )

      // Act
      await ExamplesController.handleGetExampleByFormId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockExamplesService.getSingleExampleForm).toHaveBeenCalledWith(
        MOCK_REQ_PARAMS.formId,
      )
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
    })

    it('should return 500 when error occurs whilst retrieving the example', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getSingleExampleForm to return database error.
      const mockErrorString = 'database error!'
      MockExamplesService.getSingleExampleForm.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await ExamplesController.handleGetExampleByFormId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockExamplesService.getSingleExampleForm).toHaveBeenCalledWith(
        MOCK_REQ_PARAMS.formId,
      )
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockErrorString })
    })
  })
})
