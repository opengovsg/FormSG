/* eslint-disable @typescript-eslint/ban-ts-comment */

import expressHandler from '__tests__/unit/backend/helpers/jest-express'

import { handleGenerateQuestions } from '../admin-form.assistance.controller'
import { generateQuestions } from '../admin-form.assistance.service'

// Mock openai
jest.mock('openai', () => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        message: {
          role: 'user',
          content: 'dummy content',
        },
      }),
    },
  },
}))

describe('admin-form.assistance.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleGenerateQuestions', () => {
    it('should return 200 when questions are successfully generated', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        body: {
          type: 'prompt',
          content: 'mock content',
        },
      })
      const mockRes = expressHandler.mockResponse({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      })
      // Mock generateQuestions function
      jest.spyOn(generateQuestions, 'generateQuestions').mockResolvedValue({
        role: 'user',
        content: 'mock content',
      })

      // Act
      handleGenerateQuestions(MOCK_REQ, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        role: 'user',
        content: 'mock content',
      })
    })
    it('should return 500 when openai server error occurs', async () => {
      // Arrange
      const MOCK_REQ = expressHandler.mockRequest({
        body: {
          type: 'prompt',
          content: 'mock content',
        },
      })
      const mockRes = expressHandler.mockResponse({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      })

      jest
        .spyOn(generateQuestions, 'generateQuestions')
        .mockRejectedValue(new Error('OpenAI server error'))

      // Act
      handleGenerateQuestions(
        MOCK_REQ.body.type,
        MOCK_REQ.body.content,
        mockRes,
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'OpenAI server error',
      })
    })
  })
})
