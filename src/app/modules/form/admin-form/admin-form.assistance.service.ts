import { omit } from 'lodash'
import { errAsync, ResultAsync } from 'neverthrow'

import { BasicField, FieldCreateDto } from '../../../../../shared/types'
import { IPopulatedForm } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'

import { createFormFields } from './admin-form.service'
import { Role, sendUserTextPrompt } from './ai-model'

const logger = createLoggerWithLabel(module)

const generateFormCreationPrompt = (userPrompt: string) => {
  const basicFieldNames = Object.keys(
    omit(BasicField, ['Children', 'Image']),
  ).toString()

  const messages = [
    {
      role: Role.System,
      content:
        // Provide context to model on when to use each field type
        'You will make generate form fields for a form. The purpose of the form will be provided in the next prompt.' +
        'Your next response must be an ordered array of json objects with compulsory properties named "title", "fieldType" and "required" and optional properties named "description".' +
        `The field types supported must be one of the following "[${basicFieldNames}]"` +
        'You can refer to these guidelines for choosing form field types to use:' +
        // Organising fields
        '"Section" and "Statment" field types are not meant to collect data. It is encouraged to use "Section" to organise the form fields neatly into sections.' +
        '"Statement" can be used to provide details about subsequent form fields or used together with "YesNo" to ask for approval or agreement"' +
        '"Number" is used to collect whole numbers and "Decimal" for decimal numbers, an example of "Decimal" usage is to represent money amount' +
        // Choices fields
        '"Radio" and "Checkbox" field types must have an additional property named "fieldOptions" that is an array of strings for the respondent to select from.' +
        '"Yes/No" is used to collect a boolean response, for example, whether the respondent approves to something or agrees to a "Statement" field type above.' +
        // Id fields
        '"Nric" is used to collect the unique identity number issued to each respondent, it can be used to uniquely identify the respondent.' +
        '"Uen" is a unique identifier for businesses, it can be used to uniquely identify a business.' +
        // Mobile and home number fields
        '"Mobile" is used to collect a mobile phone number. "HomeNo" is used to collect a home phone number.' +
        // Attachment field
        '"Attachment is used for the respondent to upload files.' +
        // Table field
        '"Table is used for the respondent to fill in a table of data. "Table" can be used for when the respondent needs to add an unknown number of rows to their form response.' +
        'If "Table" is used, the "columns" property must be provided in the json and be an array of strings. There must also be "minimumRows" and "addMoreRows" properties which defines whether the respondent can add more rows when responding and an optional "maximumRows" property.',
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
