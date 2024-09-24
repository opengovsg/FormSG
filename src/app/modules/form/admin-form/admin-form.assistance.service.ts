import { omit } from 'lodash'
import { errAsync, ResultAsync } from 'neverthrow'
import { z } from 'zod'

import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
  CheckboxFieldBase,
  FormField,
  RadioFieldBase,
  TableFieldBase,
} from '../../../../../shared/types'
import { IPopulatedForm } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'

import { createFormFields } from './admin-form.service'
import { Role, sendUserTextPrompt } from './ai-model'

const logger = createLoggerWithLabel(module)

type SuggestedBaseField = z.infer<typeof suggestedBaseFieldSchema>
type SuggestedTableField = z.infer<typeof suggestedTableFieldSchema>
type SuggestedChoiceField = z.infer<typeof suggestedChoicesFieldSchema>

type SuggestedFormField =
  | SuggestedBaseField
  | SuggestedTableField
  | SuggestedChoiceField

const mapSuggestedFormFieldToFieldCreateDto = (
  suggestedFormFields: SuggestedFormField[],
): FormField[] => {
  return suggestedFormFields.map((formField) => {
    const basicFieldType =
      BasicField[formField.fieldType as keyof typeof BasicField]
    if (basicFieldType === BasicField.Table) {
      const tableFormField = formField as SuggestedTableField
      return {
        fieldType: BasicField.Table,
        title: tableFormField.title,
        required: tableFormField.required,
        description: tableFormField.description ?? '',
        columns: tableFormField.columns.map((colTitle) => {
          // Only support short text columns for now
          return {
            title: colTitle,
            required: true,
            columnType: BasicField.ShortText,
            ValidationOptions: {
              customVal: null,
              selectedValidation: null,
            },
          }
        }),
        minimumRows: tableFormField.minimumRows,
        maximumRows: tableFormField.maximumRows,
        disabled: false,
      } as TableFieldBase
    } else if (
      basicFieldType === BasicField.Checkbox ||
      basicFieldType === BasicField.Radio
    ) {
      const choicesFormField = formField as SuggestedChoiceField
      return {
        fieldType:
          formField.fieldType === BasicField.Checkbox.toString()
            ? BasicField.Checkbox
            : BasicField.Radio,
        title: choicesFormField.title,
        required: choicesFormField.required,
        description: choicesFormField.description ?? '',
        fieldOptions: choicesFormField.fieldOptions,
        ValidationOptions: {
          customMax: null,
          customMin: null,
        },
        disabled: false,
        othersRadioButton: false,
        validateByValue: false,
      } as CheckboxFieldBase | RadioFieldBase
    } else if (basicFieldType === BasicField.Attachment) {
      return {
        fieldType: BasicField.Attachment,
        title: formField.title,
        required: formField.required,
        description: formField.description ?? '',
        disabled: false,
        attachmentSize: AttachmentSize.OneMb,
      } as AttachmentFieldBase
    }
    return {
      fieldType: basicFieldType,
      title: formField.title,
      required: formField.required,
      description: formField.description ?? '',
      disabled: false,
    } as Exclude<FormField, TableFieldBase | CheckboxFieldBase | RadioFieldBase>
  })
}

const generateFormCreationPrompt = (userPrompt: string) => {
  const basicFieldNames = Object.keys(omit(BasicField, ['Children', 'Image']))
    .map((fieldType) => `"${fieldType}"`)
    .toString()

  const messages = [
    {
      role: Role.System,
      content:
        // Provide context to model on when to use each field type
        'You will make generate form fields for a form. The details of this form will be provided in the next prompt.' +
        'Your next response must be an ordered array of json objects with compulsory properties named "title" of type string, "fieldType" of type string and "required" of type boolean and optional properties named "description" of type string.' +
        'You must respond starting with "[" and ending with "]" following the array notation in json. Do not include the 3 backticks, newline or any code blocks in the response. It is crucial that the response can be parsed successfully by Javascript JSON.parse().' +
        `The field type must only be a string composed of the following ${basicFieldNames}` +
        'You must refer to these rules when choosing form field types to use:' +
        // Organising fields
        '"Section" and "Statment" field types are not meant to collect data. It is encouraged to use "Section" to organise the form fields neatly into sections.' +
        '"Statement" can be used to provide details about subsequent form fields or used together with "YesNo" to ask respondent for approval or agreement"' +
        '"Number" is used to collect whole numbers and "Decimal" for decimal numbers, an example of "Decimal" usage is to represent money amount' +
        // Choices fields
        '"Radio" and "Checkbox" field types must have an additional property named "fieldOptions" that is an array of strings for the respondent to select from.' +
        '"Yes/No" is used to collect a boolean response, for example, whether the respondent approves to something or agrees to a "Statement" field type above.' +
        // Rating field
        '"Rating" can be used to collect a rating from 1 to 5, for example, to rate the satisfaction level of a service.' +
        // Id fields
        '"Nric" is used to collect the unique identity number issued to each respondent, it can be used to uniquely identify the respondent.' +
        '"Uen" is a unique identifier for businesses, it can be used to uniquely identify a business.' +
        // Mobile and home number fields
        '"Mobile" is used to collect a mobile phone number. "HomeNo" is used to collect a home phone number.' +
        // Attachment field
        '"Attachment is used for the respondent to upload files.' +
        // Table field
        '"Table is used for the respondent to fill in a table of data. "Table" can be used for when the respondent needs to add an unknown number of rows to their form response.' +
        'If "Table" is used, the "columns" property must be provided in the json and be an array of strings. There must also be integer "minimumRows" and boolean "addMoreRows" properties which defines whether the respondent can add more rows when responding and an optional integer "maximumRows" property.',
    },
    {
      // Provide general topic + example fields that user wants to collect.
      role: Role.User,
      content: `Create a form that collects ${userPrompt}. Double check that the output follows the rules above.`,
    },
  ]

  return messages
}

const suggestedBaseFieldSchema = z.object({
  title: z.string(),
  fieldType: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
})

const suggestedTableFieldSchema = z
  .object({
    fieldType: z.literal('Table'),
    columns: z.array(z.string()),
    minimumRows: z.number().int(),
    maximumRows: z.number().int().optional(),
    addMoreRows: z.boolean(),
  })
  .merge(suggestedBaseFieldSchema)

const suggestedChoicesFieldSchema = z
  .object({
    fieldType: z.literal('Checkbox').or(z.literal('Radio')),
    fieldOptions: z.array(z.string()),
  })
  .merge(suggestedBaseFieldSchema)

const suggestedFormFieldsSchema = z.array(
  z
    .union([
      // Note: The order of the schemas here is important. Order from the most restrictive to the least restrictive.
      suggestedTableFieldSchema,
      suggestedChoicesFieldSchema,
      suggestedBaseFieldSchema,
    ])
    .refine((formField) => {
      const basicFieldType =
        BasicField[formField.fieldType as keyof typeof BasicField]
      if (!basicFieldType) {
        return false
      }
      return true
    }, 'Field type generated is invalid'),
)

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
}): ResultAsync<undefined, any> => {
  return sendPromptToModel(userPrompt).map(async (modelResponse) => {
    if (!modelResponse) {
      const error = new Error('Error when generating response from model')
      logger.error({
        message: 'Error generating response from model',
        meta: {
          action: 'createFormFieldsUsingTextPrompt',
          modelResponse,
          error,
        },
      })
      // eslint-disable-next-line typesafe/no-throw-sync-func
      throw error
    }

    let suggestedFormFields
    try {
      suggestedFormFields = JSON.parse(modelResponse)
    } catch (error) {
      logger.error({
        message: 'Error parsing model response as json',
        meta: {
          action: 'createFormFieldsUsingTextPrompt',
          modelResponse,
          error,
        },
      })
      // eslint-disable-next-line typesafe/no-throw-sync-func
      throw error
    }

    const parseSuggestedFormFieldsResult =
      suggestedFormFieldsSchema.safeParse(suggestedFormFields)

    if (!parseSuggestedFormFieldsResult.success) {
      logger.error({
        message: 'Error parsing suggested form fields by model',
        meta: {
          action: 'createFormFieldsUsingTextPrompt',
          suggestedFormFields,
          error: parseSuggestedFormFieldsResult.error,
        },
      })
      // eslint-disable-next-line typesafe/no-throw-sync-func
      throw parseSuggestedFormFieldsResult.error
    }

    const parsedSuggestedFormFields = parseSuggestedFormFieldsResult.data

    const formFieldsToCreate = mapSuggestedFormFieldToFieldCreateDto(
      parsedSuggestedFormFields,
    )
    await createFormFields({ form, newFields: formFieldsToCreate, to: 0 })
    return undefined
  })
}
