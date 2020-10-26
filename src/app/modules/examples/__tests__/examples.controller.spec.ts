import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { Colors } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseError } from '../../core/core.errors'
import * as ExamplesController from '../examples.controller'
import { ResultsNotFoundError } from '../examples.errors'
import { ExamplesFactory } from '../examples.factory'
import { SingleFormResult } from '../examples.types'

jest.mock('../examples.factory')
const MockExamplesFactory = mocked(ExamplesFactory)

describe('examples.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleGetExamples', () => {
    const MOCK_REQ_QUERY = {
      pageNo: '1',
    }
    const MOCK_REQ = expressHandler.mockRequest({
      query: MOCK_REQ_QUERY,
      session: {
        user: 'exists',
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
      MockExamplesFactory.getExampleForms.mockReturnValueOnce(
        okAsync(mockResult),
      )

      // Act
      await ExamplesController.handleGetExamples(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(MockExamplesFactory.getExampleForms).toHaveBeenCalledWith(
        MOCK_REQ_QUERY,
      )
      expect(mockRes.status).toBeCalledWith(200)
      expect(mockRes.json).toBeCalledWith(mockResult)
    })

    it('should return 401 when user is not in session', async () => {
      // Arrange
      const mockReqNoSession = expressHandler.mockRequest({
        query: MOCK_REQ_QUERY,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await ExamplesController.handleGetExamples(
        mockReqNoSession,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.json).toBeCalledWith('User is unauthorized.')
    })

    it('should return 500 when error occurs whilst retrieving example forms', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getExampleForms to return error.
      MockExamplesFactory.getExampleForms.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await ExamplesController.handleGetExamples(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(MockExamplesFactory.getExampleForms).toHaveBeenCalledWith(
        MOCK_REQ_QUERY,
      )
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith('Error retrieving example forms')
    })
  })

  describe('handleGetExampleByFormId', () => {
    const MOCK_REQ_PARAMS = {
      formId: 'mockId',
    }
    const MOCK_REQ = expressHandler.mockRequest({
      params: MOCK_REQ_PARAMS,
      session: {
        user: 'exists',
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
          colorTheme: Colors.Blue,
          count: 20,
          form_fields: [],
          lastSubmission: new Date(),
          logo: 'logo',
          timeText: 'now',
          title: 'mockTitle',
        },
      }
      MockExamplesFactory.getSingleExampleForm.mockReturnValueOnce(
        okAsync(mockResult),
      )

      // Act
      await ExamplesController.handleGetExampleByFormId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockExamplesFactory.getSingleExampleForm).toHaveBeenCalledWith(
        MOCK_REQ_PARAMS.formId,
      )
      expect(mockRes.status).toBeCalledWith(200)
      expect(mockRes.json).toBeCalledWith(mockResult)
    })

    it('should return 401 when user is not in session', async () => {
      // Arrange
      const mockReqNoSession = expressHandler.mockRequest({
        params: MOCK_REQ_PARAMS,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await ExamplesController.handleGetExampleByFormId(
        mockReqNoSession,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.json).toBeCalledWith('User is unauthorized.')
    })

    it('should return 404 when the form with given formId does not exist in the database', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getSingleExampleForm to return not found error.
      const mockErrorString = 'not found error!'
      MockExamplesFactory.getSingleExampleForm.mockReturnValueOnce(
        errAsync(new ResultsNotFoundError(mockErrorString)),
      )

      // Act
      await ExamplesController.handleGetExampleByFormId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockExamplesFactory.getSingleExampleForm).toHaveBeenCalledWith(
        MOCK_REQ_PARAMS.formId,
      )
      expect(mockRes.status).toBeCalledWith(404)
      expect(mockRes.json).toBeCalledWith(mockErrorString)
    })

    it('should return 500 when error occurs whilst retrieving the example', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock getSingleExampleForm to return database error.
      const mockErrorString = 'databsae error!'
      MockExamplesFactory.getSingleExampleForm.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await ExamplesController.handleGetExampleByFormId(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockExamplesFactory.getSingleExampleForm).toHaveBeenCalledWith(
        MOCK_REQ_PARAMS.formId,
      )
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith(mockErrorString)
    })
  })
})
