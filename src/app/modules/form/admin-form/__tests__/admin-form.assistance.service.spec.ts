import { MODEL_TYPE, Roles } from '../admin-form.assistance.constants'
import { generateQuestions } from '../admin-form.assistance.service'
import { questionListPromptBuilder } from '../admin-form.assistance.utils'
import { AssistanceConnectionError } from '../admin-form.errors'

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

describe('admin-form.assistance.service', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('generateQuestions', () => {
    it('should return list of questions based on the prompt type and content', async () => {
      // Arrange
      const type = 'prompt'
      const content = 'Sample content'
      const mockMessages = [
        { role: Roles.SYSTEM, content: questionListPromptBuilder(content) },
      ]

      const mockGeneratedQuestion = {
        messages: mockMessages,
      }

      // Act
      const actualResult = await generateQuestions({ type, content })

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult).toMatchObject(mockGeneratedQuestion)
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
            create: jest.fn().mockImplementation(() => {
              throw new Error('Unable to connect to OpenAI API')
            }),
          },
        },
      }))
      const mockErrorMessage = 'Unable to connect to OpenAI API'

      // Act
      const actualResult = await generateQuestions({ type, content })
      // assuming the generateQuestions function will be using the mocked openai API?

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new AssistanceConnectionError(
          `Error while generating questions: ${mockErrorMessage}`,
        ),
      )
    })
  })

  // describe('generateFormFields', () => {
  //   it('should return a list of form fields based on the prompt type and content', async () => {})
  // })
})
