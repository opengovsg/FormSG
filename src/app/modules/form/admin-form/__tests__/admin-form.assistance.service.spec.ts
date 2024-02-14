import OpenAI from 'openai'

import {
  generateFormFields,
  generateQuestions,
} from '../admin-form.assistance.service'
import { AssistanceConnectionError } from '../admin-form.errors'

// Mock openai
jest.mock('openai', () => jest.fn())
const MockedOpenAIClient = jest.mocked(OpenAI)

const mockReturnValue = {
  role: 'user',
  content: 'dummy content',
}

beforeEach(() => {
  jest.clearAllMocks()
  MockedOpenAIClient.prototype.chat = {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: mockReturnValue,
          },
        ],
      }),
    },
  } as any
})

describe('admin-form.assistance.service', () => {
  describe('generateQuestions', () => {
    it('should return list of questions based on the prompt type and content', async () => {
      // Arrange
      const type = 'prompt'
      const content = 'Sample content'

      // Act
      const actualResult = await generateQuestions({ type, content })

      // Assert
      expect(actualResult.isOk()).toEqual(true)

      expect(actualResult._unsafeUnwrap()).toMatchObject(mockReturnValue)
    })

    it('should return list of questions based on the PDF type and content', async () => {
      // Arrange
      const type = 'pdf'
      const content = 'Sample content'

      // Act
      const actualResult = await generateQuestions({ type, content })

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toMatchObject(mockReturnValue)
    })

    it('should return AssistanceConnectionError when unable to connect to OpenAI API', async () => {
      // Arrange
      const type = 'prompt'
      const content = 'Sample content'

      // Mock OpenAI API throwing an error
      MockedOpenAIClient.prototype.chat.completions.create = jest
        .fn()
        .mockRejectedValue(new Error('Some random error message'))

      // Act
      const actualResult = await generateQuestions({ type, content })
      // assuming the generateQuestions function will be using the mocked openai API?

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        AssistanceConnectionError,
      )
    })
  })

  describe('generateFormFields', () => {
    it('should return a list of questions', async () => {
      // Arrange
      const questions = 'sample questions'

      // Act
      const actualResult = await generateFormFields(questions)

      // Assert
      expect(actualResult.isOk()).toEqual(true)

      expect(actualResult._unsafeUnwrap()).toMatchObject(mockReturnValue)
    })

    it('should return AssistanceConnectionError when unable to connect to OpenAI API', async () => {
      // Arrange
      const questions = 'sample questions'

      // Mock OpenAI API throwing an error
      MockedOpenAIClient.prototype.chat.completions.create = jest
        .fn()
        .mockRejectedValue(new Error('Some random error message'))

      // Act
      const actualResult = await generateFormFields(questions)
      // assuming the generateQuestions function will be using the mocked openai API?

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        AssistanceConnectionError,
      )
    })
  })
})
