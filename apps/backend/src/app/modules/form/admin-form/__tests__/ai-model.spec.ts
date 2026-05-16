import * as AiSdkOpenai from '@ai-sdk/openai'
import * as AiSdk from 'ai'

import {
  ModelGetClientFailureError,
  ModelResponseFailureError,
} from '../admin-form.errors'
import { sendPromptToModel } from '../ai-model'

const mockLoggerError = jest.fn()

jest.mock('ai')
jest.mock('@ai-sdk/openai')
jest.mock('src/app/config/logger', () => ({
  createLoggerWithLabel: () => ({
    info: () => undefined,
    warn: () => undefined,
    error: (...args: unknown[]) => mockLoggerError(...args),
  }),
}))

const mockedAiSdk = jest.mocked(AiSdk)
const mockedAiSdkOpenai = jest.mocked(AiSdkOpenai)

const FAKE_MODEL = { __brand: 'fake-language-model' } as never
const FAKE_PROVIDER = {
  chat: jest.fn().mockReturnValue(FAKE_MODEL),
} as unknown as ReturnType<typeof AiSdkOpenai.createOpenAI>

describe('ai-model', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(FAKE_PROVIDER.chat as jest.Mock).mockReturnValue(FAKE_MODEL)
    mockedAiSdkOpenai.createOpenAI = jest
      .fn()
      .mockReturnValue(FAKE_PROVIDER) as never
    mockLoggerError.mockReset()
  })

  describe('sendPromptToModel', () => {
    it('forwards messages to generateText and returns the resulting text', async () => {
      // Arrange
      mockedAiSdk.generateText = jest.fn().mockResolvedValue({
        text: 'model output text',
      }) as never
      const messages = [
        { role: 'system', content: 'system text' },
        { role: 'user', content: 'user text' },
      ] as AiSdk.ModelMessage[]

      // Act
      const result = await sendPromptToModel({
        messages,
        formId: 'form-id-123',
      })

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe('model output text')
      expect(AiSdk.generateText).toHaveBeenCalledTimes(1)
      expect(AiSdk.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: FAKE_MODEL,
          messages,
        }),
      )
    })

    it('returns ModelGetClientFailureError when the provider cannot be constructed', async () => {
      // Arrange
      mockedAiSdkOpenai.createOpenAI = jest.fn().mockImplementation(() => {
        throw new Error('boom: provider construction failed')
      }) as never
      mockedAiSdk.generateText = jest.fn() as never

      // Act
      const result = await sendPromptToModel({
        messages: [{ role: 'user', content: 'hi' }],
        formId: 'form-id-123',
      })

      // Assert
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ModelGetClientFailureError,
      )
      expect(AiSdk.generateText).not.toHaveBeenCalled()
    })

    it('returns ModelResponseFailureError and logs with formId when generateText rejects', async () => {
      // Arrange
      mockedAiSdk.generateText = jest
        .fn()
        .mockRejectedValue(new Error('upstream 500')) as never

      // Act
      const result = await sendPromptToModel({
        messages: [{ role: 'user', content: 'hi' }],
        formId: 'form-id-xyz',
      })

      // Assert
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        ModelResponseFailureError,
      )
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ formId: 'form-id-xyz' }),
        }),
      )
    })

    it('forwards caller options including temperature and providerOptions.openai.responseFormat to generateText', async () => {
      // Arrange
      mockedAiSdk.generateText = jest
        .fn()
        .mockResolvedValue({ text: 'ok' }) as never

      // Act
      await sendPromptToModel({
        messages: [{ role: 'user', content: 'hi' }],
        formId: 'form-id-123',
        options: {
          temperature: 0.5,
          providerOptions: {
            openai: { responseFormat: { type: 'json_object' } },
          },
        },
      })

      // Assert
      expect(AiSdk.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: FAKE_MODEL,
          temperature: 0.5,
          providerOptions: {
            openai: { responseFormat: { type: 'json_object' } },
          },
        }),
      )
    })

    it('returns null when the model response has no text content', async () => {
      // Arrange
      mockedAiSdk.generateText = jest.fn().mockResolvedValue({
        text: '',
      }) as never

      // Act
      const result = await sendPromptToModel({
        messages: [{ role: 'user', content: 'hi' }],
        formId: 'form-id-123',
      })

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBeNull()
    })
  })
})
