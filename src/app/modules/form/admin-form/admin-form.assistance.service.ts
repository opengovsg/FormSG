import { omit } from 'lodash'
import { errAsync, ResultAsync } from 'neverthrow'
import { z } from 'zod'

import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
  CheckboxFieldBase,
  DropdownFieldBase,
  FormField,
  RadioFieldBase,
  TableFieldBase,
} from '../../../../../shared/types'
import { IPopulatedForm } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { PossibleDatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../form.errors'

import {
  FieldNotFoundError,
  ModelGetClientFailureError,
  ModelResponseFailureError,
  ModelResponseInvalidSchemaFormatError,
  ModelResponseInvalidSyntaxError,
} from './admin-form.errors'
import { createFormFields, updateFormMetadata } from './admin-form.service'
import { Role, sendUserTextPrompt } from './ai-model'

const logger = createLoggerWithLabel(module)

type SuggestedBaseField = z.infer<typeof suggestedBaseFieldSchema>
type SuggestedTableField = z.infer<typeof suggestedTableFieldSchema>
type SuggestedChoiceField = z.infer<typeof suggestedChoicesFieldSchema>
type suggestedStatementField = z.infer<typeof suggestedStatementFieldSchema>

type SuggestedFormField =
  | SuggestedBaseField
  | SuggestedTableField
  | SuggestedChoiceField
  | suggestedStatementField

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
      basicFieldType === BasicField.Radio ||
      basicFieldType === BasicField.Dropdown
    ) {
      const choicesFormField = formField as SuggestedChoiceField
      return {
        fieldType: basicFieldType,
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
      } as CheckboxFieldBase | RadioFieldBase | DropdownFieldBase
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
    } as Exclude<
      FormField,
      TableFieldBase | CheckboxFieldBase | RadioFieldBase | DropdownFieldBase
    >
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
        'Generate form fields for a form which follow a set of rules:' +
        'Rule 1: the form fields must be an ordered array of json objects starting with "[" and ending with "]" following the array notation in json.' +
        'Rule 2: Each form field json object must have the compulsory properties named "title" of type string, "fieldType" of type string and "required" of type boolean and optional properties named "description" of type string.' +
        'Rule 3: Do not include the 3 backticks, newline or any code blocks in the response. It is crucial that the response can be parsed successfully by Javascript JSON.parse().' +
        `Rule 4: The field type must be a string only composed of the following ${basicFieldNames}.` +
        // Organising fields
        'Info 1: "Section" and "Statment" field types are not meant to collect data. It is encouraged to use "Section" to organise the form fields neatly into sections.' +
        'Info 2: "Statement" can be used to provide details about subsequent form fields or used together with "YesNo" to ask respondent for approval or agreement"' +
        'Rule 5: If "Statement" is used, the "description" property is compulsory.' +
        'Info 3: "Number" is used to collect whole numbers and "Decimal" for decimal numbers, an example of "Decimal" usage is to represent money amount' +
        // Choices fields
        'Rule 6: If "Dropdown", "Radio" or "Checkbox" field types are used, the json object must include an additional property named "fieldOptions" that is an array of strings for the respondent to select from.' +
        'Info 4: "Yes/No" is used to collect a boolean response, for example, whether the respondent approves to something or agrees to a "Statement" field type above.' +
        // Rating field
        'Info 5: "Rating" can be used to collect a rating from 1 to 5, for example, to rate the satisfaction level of a service.' +
        // Id fields
        'Info 6: "Nric" is used to collect the unique identity number issued to each respondent, it can be used to uniquely identify the respondent.' +
        'Info 7: "Uen" is a unique identifier for businesses, it can be used to uniquely identify a business.' +
        // Mobile and home number fields
        'Info 8: "Mobile" is used to collect a mobile phone number. "HomeNo" is used to collect a home phone number.' +
        // Attachment field
        'Info 9: "Attachment is used for the respondent to upload files.' +
        // Table field
        'Info 10: "Table is used for the respondent to fill in a table of data. "Table" can be used for when the respondent needs to add an unknown number of rows to their form response.' +
        'Rule 7: If "Table" is used, the "columns" property must be provided in the json and be an array of strings. There must also be integer "minimumRows" and boolean "addMoreRows" properties which defines whether the respondent can add more rows when responding and an optional integer "maximumRows" property.',
    },
    {
      // Provide general topic + example fields that user wants to collect.
      role: Role.User,
      content: `Create a form that collects ${userPrompt}. The array of json objects that follows all rules, can be parsed by JSON.parse() and does not include 3 backticks, newline or codeblocks is`,
    },
  ]

  return messages
}

/**
 * Field types supported by Mfb.
 */
const supportedFieldTypes = Object.keys(
  omit(BasicField, ['Children', 'Image']),
) as [string, ...string[]]

/**
 * Form field types that do not have specific object properties to validate.
 */
const baseFieldTypesEnum = z
  .enum(supportedFieldTypes)
  .exclude(['Table', 'Checkbox', 'Dropdown', 'Radio', 'Statement'])

/**
 * Used to validate model response format for suggested form fields that do not have specific object properties to validate.
 */
const suggestedBaseFieldSchema = z.object({
  title: z.string().trim().min(1),
  fieldType: baseFieldTypesEnum,
  required: z.boolean(),
  description: z.string().optional(),
})

/**
 * Used to validate model response format for suggested 'Table' field type form fields.
 */
const suggestedTableFieldSchema = suggestedBaseFieldSchema
  .merge(
    z.object({
      fieldType: z.literal('Table'),
      columns: z.array(z.string().trim().min(1)),
      minimumRows: z.number().int().min(1),
      maximumRows: z.number().int().min(1).optional(),
      addMoreRows: z.boolean(),
    }),
  )
  .refine(
    (formField) => {
      if (
        formField.maximumRows !== undefined &&
        formField.maximumRows < formField.minimumRows
      ) {
        return false
      }
      return true
    },
    {
      message: 'Maximum rows must be greater than or equal to minimum rows',
      path: ['maximumRows'],
    },
  )

/**
 * Used to validate model response format for suggested 'Statement' field type form fields.
 */
const suggestedStatementFieldSchema = suggestedBaseFieldSchema.merge(
  z.object({
    fieldType: z.literal('Statement'),
    description: z.string().trim().min(1),
  }),
)
/**
 * Used to validate model response format for suggested 'Checkbox' and 'Radio' field type form fields.
 */
const suggestedChoicesFieldSchema = suggestedBaseFieldSchema.merge(
  z.object({
    fieldType: z
      .literal('Checkbox')
      .or(z.literal('Radio'))
      .or(z.literal('Dropdown')),
    fieldOptions: z.array(z.string().trim().min(1)).nonempty(),
  }),
)

const suggestedFormFieldsSchema = z
  .array(
    z.union([
      suggestedTableFieldSchema,
      suggestedStatementFieldSchema,
      suggestedChoicesFieldSchema,
      suggestedBaseFieldSchema,
    ]),
  )
  .nonempty()

const sendPromptToModel = (
  prompt: string,
  formId: string,
): ResultAsync<
  string | null,
  ModelResponseFailureError | ModelGetClientFailureError
> => {
  const messages = generateFormCreationPrompt(prompt)
  return sendUserTextPrompt({ messages, formId }).mapErr((error) => {
    logger.error({
      message: 'Error when generating response from model',
      meta: { action: 'sendPromptToModel' },
      error,
    })
    return error
  })
}

/**
 * Sends text prompt to model to generate model response. Then, uses the model response to create form fields.
 * @param form form to generate fields for using text prompt
 * @param userPrompt user prompt to send to model
 */
export const createFormFieldsUsingTextPrompt = ({
  form,
  userPrompt,
}: {
  form: IPopulatedForm
  userPrompt: string
}): ResultAsync<
  undefined,
  | ModelResponseFailureError
  | ModelResponseInvalidSchemaFormatError
  | ModelResponseInvalidSyntaxError
  | PossibleDatabaseError
  | FormNotFoundError
  | FieldNotFoundError
> => {
  return sendPromptToModel(userPrompt, form.id)
    .andThen((modelResponse) => {
      if (!modelResponse) {
        const modelResponseFailureError = new ModelResponseFailureError()
        logger.error({
          message: 'Error generating response from model',
          meta: {
            action: 'createFormFieldsUsingTextPrompt',
            modelResponse,
            error: modelResponseFailureError,
          },
        })
        return errAsync(modelResponseFailureError)
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
        return errAsync(new ModelResponseInvalidSyntaxError())
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
        return errAsync(new ModelResponseInvalidSchemaFormatError())
      }

      const parsedSuggestedFormFields = parseSuggestedFormFieldsResult.data
      const formFieldsToCreate = mapSuggestedFormFieldToFieldCreateDto(
        parsedSuggestedFormFields,
      )
      return createFormFields({ form, newFields: formFieldsToCreate, to: 0 })
    })
    .andThen(() => updateFormMetadata(form, { ...form.metadata, mfb: true }))
    .map(() => undefined)
}
