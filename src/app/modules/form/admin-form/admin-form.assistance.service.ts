import { AzureKeyCredential, OpenAIClient } from '@azure/openai'
import {
  ChatRequestMessage,
  ChatResponseMessage,
  GetChatCompletionsOptions,
} from '@azure/openai/types/openai'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { ContentTypes } from '../../../../../shared/types/assistance'
import { azureOpenAIConfig } from '../../../config/features/azureopenai.config'
import { createLoggerWithLabel } from '../../../config/logger'

import { Roles, sampleFormFields } from './admin-form.assistance.constants'
import {
  formFieldsPromptBuilder,
  getExpectedQuestionsListTool,
  getFormFieldsTool,
  isOpenAIError,
  migratePromptBuilder,
  questionListPromptBuilder,
  schemaPromptBuilder,
} from './admin-form.assistance.utils'
import {
  AssistanceConnectionError,
  AssistanceModelTypeError,
} from './admin-form.errors'

const logger = createLoggerWithLabel(module)

const endpoint = azureOpenAIConfig.endpoint
const azureApiKey = azureOpenAIConfig.apiKey
const deploymentId = azureOpenAIConfig.deploymentId

const azureOpenAi = new OpenAIClient(
  endpoint,
  new AzureKeyCredential(azureApiKey),
)
/**
 * generates a list of questions based on the given type and content
 * @param {string} param.type - The type of content provided. "prompt" or "pdf"
 * @param {string} param.content - prompt or parsed pdf content
 * @returns a ResultAsync containing the generated questions or an AssistanceConnectionError if there was an error connecting to OpenAI
 */

export const generateQuestions = ({
  type,
  content,
}: {
  type: string
  content: string
}): ResultAsync<ChatResponseMessage, AssistanceConnectionError> => {
  const messages: ChatRequestMessage[] = [
    {
      role: Roles.SYSTEM,
      content: schemaPromptBuilder(sampleFormFields),
    } as ChatRequestMessage,
  ]
  switch (type) {
    case ContentTypes.PROMPT:
      messages.push({
        role: Roles.USER,
        content: questionListPromptBuilder(content),
      } as ChatRequestMessage)
      break
    case ContentTypes.PDF:
      messages.push({
        role: Roles.USER,
        content: migratePromptBuilder(content),
      } as ChatRequestMessage)
      break
    default:
      return errAsync(new AssistanceModelTypeError())
  }

  const options = {
    tools: [
      {
        type: 'function',
        function: getExpectedQuestionsListTool,
      },
    ],
    topP: 0.1,
  } as GetChatCompletionsOptions

  return ResultAsync.fromPromise(
    azureOpenAi.getChatCompletions(deploymentId, messages, options),
    (error) => {
      let errorMessage = ''
      if (isOpenAIError(error)) {
        errorMessage = error.message
      }
      logger.error({
        message: `Error while generating questions: ${errorMessage}`,
        meta: {
          action: 'generateQuestions',
          type,
          content,
        },
        error,
      })

      return new AssistanceConnectionError()
    },
  ).andThen((chatCompletions) => {
    const { message } = chatCompletions.choices[0]
    if (!message) {
      return errAsync(new AssistanceConnectionError())
    }
    return okAsync(message)
  })
}

/**
 * Generates form fields based on the given type and content.
 *
 * @param {string} param.questions - List of questions
 *
 * @returns {ResultAsync} A ResultAsync with either a ChatCompletionMessage or an error.
 * Possible errors include AssistanceConnectionError and AssistanceModelTypeError.
 */
export const generateFormFields = (
  questions: string,
): ResultAsync<
  ChatResponseMessage,
  AssistanceConnectionError | AssistanceModelTypeError
> => {
  const messages: ChatRequestMessage[] = [
    {
      role: Roles.SYSTEM,
      content: schemaPromptBuilder(sampleFormFields),
    } as ChatRequestMessage,
    {
      role: Roles.USER,
      content: formFieldsPromptBuilder(questions, sampleFormFields),
    } as ChatRequestMessage,
  ]

  const options = {
    tools: [
      {
        type: 'function',
        function: getFormFieldsTool,
      },
    ],
    temperature: 0.1,
  } as GetChatCompletionsOptions

  return ResultAsync.fromPromise(
    azureOpenAi.getChatCompletions(deploymentId, messages, options),
    (error) => {
      let errorMessage = ''
      if (isOpenAIError(error)) {
        errorMessage = error.message
      }
      logger.error({
        message: `Error while generating form fields: ${errorMessage}`,
        meta: {
          action: 'generateFormFields',
          questions,
        },
        error,
      })
      return new AssistanceConnectionError()
    },
  ).andThen((chatCompletions) => {
    const { message } = chatCompletions.choices[0]
    if (!message) {
      return errAsync(new AssistanceConnectionError())
    }
    return okAsync(message)
  })
}
