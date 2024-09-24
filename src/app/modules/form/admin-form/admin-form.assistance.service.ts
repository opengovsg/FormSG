import { errAsync, ResultAsync } from 'neverthrow'

import { FieldCreateDto } from '../../../../../shared/types'
import { IPopulatedForm } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'

import { createFormFields } from './admin-form.service'
import { Role, sendUserTextPrompt } from './ai-model'

const logger = createLoggerWithLabel(module)

const generateFormCreationPrompt = (userPrompt: string) => {
  const messages = [
    {
      role: Role.System,
      content:
        // Provide context to model on when to use each field type
        'You will make a form for the purpose described in the next prompt.' +
        'Your next response must be an ordered array of objects with compulsory properties named "fieldName" and "fieldType" and an optional property named "description"' +
        'The field types supported must be one of the following "short_answer", "long_answer", "radio", "checkbox", "dropdown", "country/region", "heading", "paragraph", "yes/no", "rating", "email", "mobile_number", "home_number", "date", "attachment", "number", "decimal", "nric"]' +
        '"heading" and "paragraph" field types are used to organise and provide information to the respondent about the form and not meant to collect data. It is encouraged to use "heading" to organise the form fields into sections.' +
        '"radio" and "checkbox" field types must have an additional property named "options" that is an array of strings for the respondent to select from.' +
        '"nric" is used to collect the unique identity number issued to each respondent, it can be used to uniquely identify of the respondent.' +
        '"yes/no" is used to collect a boolean response, for example, whether the respondent approves to something or agrees to a paragraph field above.',
    },
    {
      // Provide general topic + example fields that user wants to collect.
      role: Role.User,
      content: `Create a form that collects ${userPrompt}`,
    },
  ]

  return messages
}

const sendPromptToModel = (
  prompt: string,
): ResultAsync<string | null, unknown> => {
  const messages = generateFormCreationPrompt(prompt)
  return ResultAsync.fromPromise(sendUserTextPrompt({ messages }), (error) => {
    logger.error({
      message: 'Error when generating response from model',
      meta: { action: 'sendPromptToModel' },
      error,
    })
    return errAsync(error)
  })
}

export const createFormFieldsUsingTextPrompt = ({
  form,
  userPrompt,
}: {
  form: IPopulatedForm
  userPrompt: string
}): ResultAsync<undefined, unknown> => {
  return sendPromptToModel(userPrompt).map(async (modelResponse) => {
    console.log('modelResponse:', modelResponse)
    const formFieldsToCreate: FieldCreateDto[] = []
    await createFormFields({ form, newFields: formFieldsToCreate, to: 0 })
    return undefined
  })
}
