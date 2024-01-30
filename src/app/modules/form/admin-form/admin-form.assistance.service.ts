import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import OpenAI from 'openai'
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from 'openai/src/resources/chat/completions'

import { ContentTypes } from '../../../../../shared/types/assistance'
import { openAIConfig } from '../../../config/features/openai.config'
import { createLoggerWithLabel } from '../../../config/logger'

import {
  MODEL_TYPE,
  Roles,
  sampleFormFields,
} from './admin-form.assistance.constants'
import {
  formFieldsPromptBuilder,
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

const openai = new OpenAI({
  apiKey: openAIConfig.apiKey,
})

/**
 * generates a list of questions based on the given purpose
 * @param purpose the purpose of the questions, e.g. "registration", "login", etc.
 * @returns a ResultAsync containing the generated questions or an AssistanceConnectionError if there was an error connecting to OpenAI
 */
export const generateQuestions = (
  purpose: string,
): ResultAsync<ChatCompletionMessage, AssistanceConnectionError> => {
  const messages: ChatCompletionMessageParam[] = [
    { role: Roles.SYSTEM, content: schemaPromptBuilder(sampleFormFields) },
    {
      role: Roles.USER,
      content: questionListPromptBuilder(purpose),
    },
  ]
  return ResultAsync.fromPromise(
    openai.chat.completions.create({
      messages: messages,
      model: MODEL_TYPE,
    }),
    (error) => {
      let errorMessage = ''
      // todo: return different error messages based on error codes
      if (isOpenAIError(error)) {
        errorMessage = error.message
      }
      logger.error({
        message: `Error while generating questions: ${errorMessage}`,
        meta: {
          action: 'generateQuestions',
          purpose,
        },
        error,
      })

      return new AssistanceConnectionError()
    },
  ).andThen((chatCompletion) => {
    return okAsync(chatCompletion.choices[0].message)
  })
}

/**
 * Generates form fields based on the given type and content.
 *
 * @param {object} param - The type and content parameters.
 * @param {string} param.type - The type of content provided. "questions" or "pdf"
 * @param {string} param.content - List of questions or parsed pdf content
 *
 * @returns {ResultAsync} A ResultAsync with either a ChatCompletionMessage or an error.
 * Possible errors include AssistanceConnectionError and AssistanceModelTypeError.
 */
export const generateFormFields = ({
  type,
  content,
}: {
  type: string
  content: string
}): ResultAsync<
  ChatCompletionMessage,
  AssistanceConnectionError | AssistanceModelTypeError
> => {
  const messages: ChatCompletionMessageParam[] = [
    { role: Roles.SYSTEM, content: schemaPromptBuilder(sampleFormFields) },
  ]
  switch (type) {
    case ContentTypes.QUESTIONS:
      messages.push({
        role: Roles.USER,
        content: formFieldsPromptBuilder(content),
      })
      break
    case ContentTypes.PDF:
      messages.push({
        role: Roles.USER,
        content: migratePromptBuilder(content),
      })
      break
    default:
      return errAsync(new AssistanceModelTypeError())
  }
  return ResultAsync.fromPromise(
    openai.chat.completions.create({
      messages: messages,
      model: MODEL_TYPE,
    }),
    (error) => {
      let errorMessage = ''
      if (isOpenAIError(error)) {
        errorMessage = error.message
      }
      logger.error({
        message: `Error while generating form fields: ${errorMessage}`,
        meta: {
          action: 'generateFormFields',
          type,
        },
        error,
      })
      return new AssistanceConnectionError()
    },
  ).andThen((chatCompletion) => {
    return okAsync(chatCompletion.choices[0].message)
  })
}
