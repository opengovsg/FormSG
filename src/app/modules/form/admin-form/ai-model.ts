import { err, errAsync, ok, Result, ResultAsync } from 'neverthrow'
import OpenAI, { AzureOpenAI } from 'openai'
import { OpenAIError } from 'openai/error'
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/index'
import type { Stream } from 'openai/streaming'

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
    // Debug logging for API key configuration
    logger.info({
      message: 'Creating LLM client',
      meta: {
        action: 'getLlmClient',
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length ?? 0,
        hasEndpoint: !!endpoint,
        hasDeployment: !!deploymentName,
        hasApiVersion: !!apiVersion,
      },
    })

    if (!apiKey) {
      logger.error({
        message: 'Azure OpenAI API key is not configured',
        meta: {
          action: 'getLlmClient',
        },
      })
      return err(new ModelGetClientFailureError())
    }

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

export type Message = ChatCompletionMessageParam

/**
 * Sends prompt to the AI LLM and returns the response.
 * @param {Message[]} params.messages - An array of message objects to send to the AI.
 * @param {Object} [params.options] - Optional parameters for the chat completion.
 * @param {string} params.formId - The ID of the form associated with this request. Used for logging.
 * @returns {ResultAsync<string | null, ModelGetClientFailureError>} A Result containing the AI's response or null if no response, or an error if the request fails.
 */
export const sendPromptToModel = ({
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
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : JSON.stringify(err)

      // Extract error details if available
      const errorDetails: Record<string, unknown> = {}
      if (err instanceof OpenAIError) {
        // OpenAIError may have different properties depending on the error type
        const errObj = err as unknown as Record<string, unknown>
        if ('status' in errObj) errorDetails.status = errObj.status
        if ('code' in errObj) errorDetails.code = errObj.code
        if ('param' in errObj) errorDetails.param = errObj.param
        if ('type' in errObj) errorDetails.type = errObj.type
      }

      logger.error({
        message: 'Failed to generate model response',
        meta: {
          ...logMeta,
          errorMessage,
          errorDetails,
          responseFormat: options?.response_format,
          errorName: err instanceof Error ? err.name : typeof err,
        },
        error: err,
      })

      const statusMessage = errorDetails.status
        ? ` Status: ${errorDetails.status}`
        : ''
      return new ModelResponseFailureError(
        `Model API error: ${errorMessage}.${statusMessage}`,
      )
    },
  ).map((response) => {
    const isLlmResponseMissing =
      !response.choices ||
      response.choices.length <= 0 ||
      !response.choices[0].message?.content

    if (isLlmResponseMissing) {
      logger.warn({
        message: 'Model response is missing content',
        meta: {
          ...logMeta,
          responseChoices: response.choices?.length,
          hasMessage: !!response.choices?.[0]?.message,
        },
      })
      return null
    }
    return response.choices[0].message?.content
  })
}

/**
 * Sends prompt to the AI LLM and returns a streaming response.
 * @param {Message[]} params.messages - An array of message objects to send to the AI.
 * @param {Object} [params.options] - Optional parameters for the chat completion.
 * @param {string} params.formId - The ID of the form associated with this request. Used for logging.
 * @returns {Result<Stream, ModelGetClientFailureError>} A Result containing the stream or an error.
 */
export const sendPromptToModelStreaming = ({
  messages,
  options,
  formId,
}: {
  messages: Message[]
  options?: Omit<ChatCompletionCreateParamsStreaming, 'model' | 'messages' | 'stream'>
  formId: string
}): ResultAsync<
  Stream<OpenAI.Chat.Completions.ChatCompletionChunk>,
  ModelGetClientFailureError | ModelResponseFailureError
> => {
  const logMeta = {
    action: 'sendPromptToModelStreaming',
    formId,
  }
  const getLlmClientResult = getLlmClient()

  if (getLlmClientResult.isErr()) {
    logger.error({
      message: 'Failed to get Llm client for streaming',
      meta: logMeta,
      error: getLlmClientResult.error,
    })
    return errAsync(getLlmClientResult.error)
  }

  const llmClient = getLlmClientResult.value

  const chatCompletionPrompt: ChatCompletionCreateParamsStreaming = {
    messages,
    model,
    stream: true,
    ...options,
  }

  return ResultAsync.fromPromise(
    llmClient.chat.completions.create(chatCompletionPrompt),
    (err) => {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : JSON.stringify(err)

      logger.error({
        message: 'Failed to create streaming response',
        meta: {
          ...logMeta,
          errorMessage,
        },
        error: err,
      })

      return new ModelResponseFailureError(
        `Model streaming API error: ${errorMessage}`,
      )
    },
  )
}

// Re-export OpenAI types for use in other modules
export type { OpenAI }
