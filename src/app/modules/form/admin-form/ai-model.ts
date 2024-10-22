import { err, errAsync, ok, Result, ResultAsync } from 'neverthrow'
import { AzureOpenAI } from 'openai'
import { OpenAIError } from 'openai/error'
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/index'

import { azureOpenAIConfig } from '../../../config/features/azureopenai.config'
import { createLoggerWithLabel } from '../../../config/logger'

import {
  ModelGetClientFailureError,
  ModelResponseFailureError,
} from './admin-form.errors'

const { endpoint, apiKey, apiVersion, deploymentName, model } =
  azureOpenAIConfig

const logger = createLoggerWithLabel(module)

const getLlmClient = (): Result<AzureOpenAI, OpenAIError> => {
  try {
    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
      deployment: deploymentName,
    })
    return ok(client)
  } catch (error) {
    logger.error({
      message: 'Error occurred when getting Llm client',
      meta: {
        action: 'getLlmClient',
      },
      error,
    })
    return err(new ModelGetClientFailureError())
  }
}

export enum Role {
  User = 'user',
  System = 'system',
}

export interface Message {
  role: Role
  content: string
}

/**
 * Sends a text prompt to the AI LLM and returns the response.
 * @param {Message[]} params.messages - An array of message objects to send to the AI.
 * @param {Object} [params.options] - Optional parameters for the chat completion.
 * @param {string} params.formId - The ID of the form associated with this request. Used for logging.
 * @returns {ResultAsync<string | null, ModelGetClientFailureError>} A Result containing the AI's response or null if no response, or an error if the request fails.
 */
export const sendUserTextPrompt = ({
  messages,
  options,
  formId,
}: {
  messages: Message[]
  options?: Omit<ChatCompletionCreateParamsNonStreaming, 'model' | 'messages'>
  formId: string
}): ResultAsync<
  string | null,
  ModelGetClientFailureError | ModelResponseFailureError
> => {
  const logMeta = {
    action: 'sendUserTextPrompt',
    formId,
  }
  const getLlmClientResult = getLlmClient()

  if (getLlmClientResult.isErr()) {
    logger.error({
      message: 'Failed to get Llm client',
      meta: logMeta,
      error: getLlmClientResult.error,
    })
    return errAsync(getLlmClientResult.error)
  }

  const llmClient = getLlmClientResult.value

  const chatCompletionPrompt: ChatCompletionCreateParamsNonStreaming = {
    messages,
    model,
    ...options,
  }

  return ResultAsync.fromPromise(
    llmClient.chat.completions.create(chatCompletionPrompt),
    (err) => {
      logger.error({
        message: 'Failed to generate model response',
        meta: logMeta,
        error: err,
      })
      return new ModelResponseFailureError()
    },
  ).map((response) => {
    const isLlmResponseMissing =
      !response.choices ||
      response.choices.length <= 0 ||
      !response.choices[0].message?.content

    if (isLlmResponseMissing) {
      return null
    }
    return response.choices[0].message?.content
  })
}
