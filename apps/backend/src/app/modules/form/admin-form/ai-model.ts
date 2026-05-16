import { createOpenAI } from '@ai-sdk/openai'
import { generateText, ModelMessage } from 'ai'
import { errAsync, ResultAsync } from 'neverthrow'

import { aisdkConfig } from '../../../config/features/aisdk.config'
import { createLoggerWithLabel } from '../../../config/logger'

import {
  ModelGetClientFailureError,
  ModelResponseFailureError,
} from './admin-form.errors'

const logger = createLoggerWithLabel(module)

export type Message = ModelMessage

type GenerateTextArgs = Parameters<typeof generateText>[0]
export type SendPromptOptions = Omit<
  GenerateTextArgs,
  'model' | 'messages' | 'prompt'
>

export const sendPromptToModel = ({
  messages,
  options,
  formId,
}: {
  messages: Message[]
  options?: SendPromptOptions
  formId: string
}): ResultAsync<
  string | null,
  ModelGetClientFailureError | ModelResponseFailureError
> => {
  const { providerName, apiKey, baseUrl, modelName } = aisdkConfig

  let model
  try {
    const provider = createOpenAI({
      name: providerName,
      apiKey,
      baseURL: baseUrl,
    })
    model = provider.chat(modelName)
  } catch (error) {
    logger.error({
      message: 'Failed to construct ai-sdk provider client',
      meta: { action: 'sendPromptToModel', formId },
      error,
    })
    return errAsync(new ModelGetClientFailureError())
  }

  return ResultAsync.fromPromise(
    generateText({
      ...options,
      model,
      messages,
    }),
    (err) => {
      logger.error({
        message: 'Failed to generate model response',
        meta: { action: 'sendPromptToModel', formId },
        error: err,
      })
      return new ModelResponseFailureError()
    },
  ).map((response) => {
    if (!response.text) return null
    return response.text
  })
}
