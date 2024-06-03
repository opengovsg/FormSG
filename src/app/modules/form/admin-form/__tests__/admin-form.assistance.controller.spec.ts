/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { OpenAIClient } from '@azure/openai'
import { okAsync } from 'neverthrow'

import {
  handleGenerateFormFields,
  handleGenerateQuestions,
} from '../admin-form.assistance.controller'
import * as AdminFormAssistanceService from '../admin-form.assistance.service'

// Mock openai
const mockReturnValue = {
  role: 'user',
  content: 'dummy content',
}

// Mock azure openai
jest.mock('@azure/openai')

beforeAll(async () => await dbHandler.connect())
beforeEach(async () => {
  await dbHandler.clearDatabase()
})
afterAll(async () => await dbHandler.closeDatabase())

beforeEach(() => {
  jest.clearAllMocks()

  jest
    .spyOn(OpenAIClient.prototype, 'getChatCompletions')
    .mockResolvedValue({ choices: [{ message: mockReturnValue }] } as any)
})

describe('admin-form.assistance.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleGenerateQuestions', () => {
    it('should return 200 when questions are successfully generated', async () => {
      const { user } = await dbHandler.insertEncryptForm({
        userBetaFlags: { mfb: true },
      })
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        body: {
          type: 'prompt',
          content: 'mock content',
        },
        session: {
          user: {
            _id: user._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()

      const MOCK_RESULT = 'some result'

      const generateQuestionsSpy = jest
        .spyOn(AdminFormAssistanceService, 'generateQuestions')
        .mockReturnValueOnce(okAsync(MOCK_RESULT) as any)

      // Act
      await handleGenerateQuestions(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(generateQuestionsSpy).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(MOCK_RESULT)
    })

    it('should return 500 when openai server error occurs', async () => {
      const { user } = await dbHandler.insertEncryptForm({
        userBetaFlags: { mfb: true },
      })
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        body: {
          type: 'prompt',
          content: 'mock content',
        },
        session: {
          user: {
            _id: user._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockResolvedValue({
          result: {
            value: 'sample value',
          },
        }),
      })

      // Mock OpenAI API throwing an error

      jest
        .spyOn(OpenAIClient.prototype, 'getChatCompletions')
        .mockRejectedValue({ choices: [{ message: mockReturnValue }] } as any)

      // Act
      await handleGenerateQuestions(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error while connecting to OpenAI',
      })
    })
  })

  describe('handleGenerateFormFields', () => {
    it('should return 200 when fields are successfully generated', async () => {
      const { user } = await dbHandler.insertEncryptForm({
        userBetaFlags: { mfb: true },
      })
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        body: {
          content: 'mock content',
        },
        session: {
          user: {
            _id: user._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockResolvedValue({
          result: {
            value: 'sample value',
          },
        }),
      })

      // Act
      await handleGenerateFormFields(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockReturnValue)
    })

    it('should return 500 when openai server error occurs', async () => {
      const { user } = await dbHandler.insertEncryptForm({
        userBetaFlags: { mfb: true },
      })
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        body: {
          content: 'mock content',
        },
        session: {
          user: {
            _id: user._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockResolvedValue({
          result: {
            value: 'sample value',
          },
        }),
      })

      // Mock OpenAI API throwing an error
      jest
        .spyOn(OpenAIClient.prototype, 'getChatCompletions')
        .mockRejectedValue({ choices: [{ message: mockReturnValue }] } as any)

      // Act
      await handleGenerateFormFields(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error while connecting to OpenAI',
      })
    })
  })
})
