import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import OpenAI from 'openai'
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from 'openai/src/resources/chat/completions'

import { createLoggerWithLabel } from '../../../config/logger'

import {
  ContentTypes,
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
  apiKey: 'fake-key',
})
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
