import OpenAI from 'openai'

import { MODEL_TYPE, Roles } from '../admin-form.assistance.constants'
import { generateQuestions } from '../admin-form.assistance.service'
import { AssistanceConnectionError } from '../admin-form.errors'

// Mock openai

const mockReturnValue = {
  role: 'user',
  content: 'dummy content',
}

jest.mock('openai', () => {
  return jest.fn().mockImplementation(
    () =>
      ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    role: 'user',
                    content: 'dummy content',
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI),
  )
})

describe('admin-form.assistance.service', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

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
      const mockMessages = [{ role: Roles.SYSTEM, content: expect.any(String) }]

      const mockGeneratedQuestion = {
        messages: mockMessages,
        model: MODEL_TYPE,
      }

      // Act
      const actualResult = await generateQuestions({ type, content })

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult).toMatchObject(mockGeneratedQuestion)
    })

    it('should return AssistanceConnectionError when unable to connect to OpenAI API', async () => {
      // Arrange
      const type = 'prompt'
      const content = 'Sample content'

      // Mock OpenAI API throwing an error
      jest.mock('openai', () => ({
        chat: {
          completions: {
            create: jest
              .fn()
              .mockRejectedValue(new Error('Some random error message')),
          },
        },
      }))

      // Act
      const actualResult = await generateQuestions({ type, content })
      // assuming the generateQuestions function will be using the mocked openai API?

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        AssistanceConnectionError,
      )
    })
  })

  // describe('generateFormFields', () => {
  //   it('should return a list of form fields based on the prompt type and content', async () => {})
  // })
})
