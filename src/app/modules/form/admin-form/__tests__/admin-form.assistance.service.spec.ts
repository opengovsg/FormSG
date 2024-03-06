import { OpenAIClient } from '@azure/openai'

import {
  generateFormFields,
  generateQuestions,
} from '../admin-form.assistance.service'
import {
  AssistanceConnectionError,
  AssistanceModelTypeError,
} from '../admin-form.errors'

const mockReturnValue = {
  role: 'user',
  content: 'dummy content',
}

beforeEach(() => {
  jest.clearAllMocks()

  jest
    .spyOn(OpenAIClient.prototype, 'getChatCompletions')
    .mockResolvedValue({ choices: [{ message: mockReturnValue }] } as any)
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

      // Mock Azure OpenAI API throwing an error

      jest
        .spyOn(OpenAIClient.prototype, 'getChatCompletions')
        .mockRejectedValue(new Error('Some random error message'))

      // Act
      const actualResult = await generateQuestions({ type, content })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        AssistanceConnectionError,
      )
    })

    it('should return AssistanceModelTypeError when type is not prompt or pdf', async () => {
      // Arrange
      const type = 'wrong type'
      const content = 'Sample content'

      // Act
      const actualResult = await generateQuestions({ type, content })
      // assuming the generateQuestions function will be using the mocked openai API?

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        AssistanceModelTypeError,
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

      jest
        .spyOn(OpenAIClient.prototype, 'getChatCompletions')
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
