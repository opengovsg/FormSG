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
import { FormFieldSchema, IPopulatedForm } from '../../../../types'
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
import { Message, Role, sendPromptToModel } from './ai-model'

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
        required: true,
        description: tableFormField.description ?? '',
        columns: tableFormField.columns.map((colTitle) => {
          // Only support short text columns for now
          return {
            title: colTitle,
            required: tableFormField.required,
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

const BASIC_FIELD_NAMES = Object.keys(omit(BasicField, ['Children', 'Image']))
  .map((fieldType) => `"${fieldType}"`)
  .toString()

const VERIFICATION_PROMPT = {
  role: 'user',
  content: [
    {
      type: 'text',
      text: 'Before providing your final answer, please verify that your output follows all rules and guidelines provided in the system prompt.',
    },
  ],
}

const FORM_RULES_TEXT_PROMPT = {
  role: Role.System,
  content:
    // Provide context to model on when to use each field type
    'You are to generate a JSON output that is a list of form fields that are to be used to create a form. The JSON output must contain a single key named "fields" which is an array of form fields. Every form field must follow the rules and guidelines provided.' +
    'Rule 1: The form fields must be an ordered array of json objects starting with "[" and ending with "]" following the array notation in json.' +
    'Rule 2: Each form field json object must have the compulsory properties named "title" of type string, "fieldType" of type string and "required" of type boolean and optional properties named "description" of type string. Note that "description" must always be provided when "Statement" field type is used and "title" property is not used for "Statement" field type.' +
    `Rule 3: The field type must be a string only composed of the following ${BASIC_FIELD_NAMES}.` +
    // Organising fields
    'Guideline 1: "Section" and "Statement" field types are not meant to collect data. It is encouraged to use "Section" to organise the form fields neatly into sections.' +
    'Guideline 2: "Statement" can be used to provide details about subsequent form fields or used together with "YesNo" to ask respondent for approval or agreement"' +
    'Rule 4: When "Statement" field is used, the "description" and "required" properties are compulsory and must be provided and the title must be the same as the description. For example, {"fieldType": "Statement", "title": "Input descrtiption text here. Must be included and be non-empty string.", "required": true, "description": "Input descrtiption text here. Must be included and be non-empty string."}. This "description" property is where you provide the paragraph of text to provide necessary context about following fields.' +
    'Guideline 3: "Number" is used to collect whole numbers and "Decimal" for decimal numbers, an example of "Decimal" usage is to represent money amount' +
    // Choices fields
    'Rule 5: If "Dropdown", "Radio" or "Checkbox" field types are used, the json object must include an additional property named "fieldOptions" that is an array of strings for the respondent to select from. For example, {"fieldType": "Checkbox", "title": "Selected language", "required": true, "description": "Dropdown description", "fieldOptions": ["Chinese", "Malay", "Tamil"]}' +
    'Guideline 4: "Yes/No" is used to collect a boolean response, for example, whether the respondent approves to something or agrees to a text. For example, {"fieldType": "YesNo", "title": "Text from the form describing what the respondent is agreeing to", "required": true, "description": "Provide any additional text from the form here if needed."}' +
    // Rating field
    'Guideline 5: "Rating" can be used to collect a rating from 1 to 5, for example, to rate the satisfaction level of a service.' +
    // Id fields
    'Guideline 6: "Nric" is used to collect the unique identity number issued to each respondent, it can be used to uniquely identify the respondent.' +
    'Guideline 7: "Uen" is a unique identifier for businesses, it can be used to uniquely identify a business.' +
    // Mobile and home number fields
    'Guideline 8: "Mobile" is used to collect a mobile phone number. "HomeNo" is used to collect a home phone number.' +
    // Attachment field
    'Guideline 9: "Attachment is used for the respondent to upload files.' +
    // Table field
    'Guideline 10: "Table is used for the respondent to fill in a table of data. "Table" can be used for when the respondent needs to add an unknown number of rows to their form response.' +
    'Rule 6: If "Table" is used, the "columns" property must be provided in the json and be an array of strings. There must also be integer "minimumRows" and boolean "addMoreRows" properties which defines whether the respondent can add more rows when responding and an optional integer "maximumRows" property. For example, {"fieldType": "Table", "title": "Table title", "required": true, "description": "Table description", "columns": ["Column 1", "Column 2", "Column 3"], "minimumRows": 1, "addMoreRows": true, "maximumRows": 10}.' +
    'Guideline 18: "Address" is used to collect the address of the respondent.',
}

const generateFormCreationPrompt = (userPrompt: string) => {
  const messages = [
    FORM_RULES_TEXT_PROMPT,
    {
      // Provide general topic + example fields that user wants to collect.
      role: Role.User,
      content: `Create a form that collects ${userPrompt}. The JSON object containing "fields" key which contains an array of form fields that definitely follows all the given rules and guidelines is `,
    },
    VERIFICATION_PROMPT,
  ]

  return messages as Message[]
}

/**
 * Field types supported by Mfb.
 */
const supportedFieldTypes = Object.keys(
  omit(BasicField, ['Children', 'Image', 'Signature']),
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
    title: z.string().optional(),
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

const suggestedFormFieldsSchema = z.object({
  fields: z
    .array(
      z.union([
        suggestedTableFieldSchema,
        suggestedStatementFieldSchema,
        suggestedChoicesFieldSchema,
        suggestedBaseFieldSchema,
      ]),
    )
    .nonempty(),
})

const generateAndsendTextPromptToModel = ({
  formId,
  userPrompt,
}: {
  userPrompt: string
  formId: string
}): ResultAsync<
  string | null,
  ModelResponseFailureError | ModelGetClientFailureError
> => {
  const messages = generateFormCreationPrompt(userPrompt)
  return sendPromptToModel({
    messages: messages,
    formId,
    options: {
      response_format: {
        type: 'json_object',
      },
    },
  }).mapErr((error) => {
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
  FormFieldSchema['_id'][],
  | ModelResponseFailureError
  | ModelResponseInvalidSchemaFormatError
  | ModelResponseInvalidSyntaxError
  | PossibleDatabaseError
  | FormNotFoundError
  | FieldNotFoundError
> => {
  return generateAndsendTextPromptToModel({
    userPrompt,
    formId: form.id,
  })
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
        parsedSuggestedFormFields.fields,
      )
      return createFormFields({ form, newFields: formFieldsToCreate, to: 0 })
    })
    .map((updatedFields) => {
      updateFormMetadata(form, {
        ...form.metadata,
        mfb_text_prompt_count: (form.metadata?.mfb_text_prompt_count ?? 0) + 1,
      })
      return updatedFields.map((field) => field._id)
    })
}

const FORM_DETAILS_VISION_PROMPT = {
  role: Role.System,
  content:
    // Provide context to model on when to use each field type
    'You are to generate a JSON output that is a list of form fields that are to be used to create a form. The JSON output must contain a single key named "fields" which is an array of form fields. Every form field must follow the rules and guidelines provided.' +
    'You will be given a set of images depicting a paper form. Recreate the paper form exactly.' +
    'Rule 1: Recreate the paper form exactly. All text including words, numbers, symbols, etc in the images must be included in the generated form fields. (For example, if the image has a paragraph: "1. Paragraph text here.", a form field {"fieldType": "Statement", "title": "Paragraph text here.", "required": true, "description": "Paragraph text here."} must be included in the generated form fields.) Do not modify the text or add additional words not found in the image.' +
    'Rule 2: The form fields must be an ordered array of json objects starting with "[" and ending with "]" following the array notation in json. This ordering should closely follow the field ordering provided in the image.' +
    'Rule 3: Each form field json object must have the compulsory properties named "title" of type string, "fieldType" of type string and "required" of type boolean and optional properties named "description" of type string. Note that "description" must always be provided when "Statement" field type is used and "title" property is not used for "Statement" field type.' +
    'Guideline 1: If you see * after a field in the image, for example, name*, this means tha the name is required and hence should be set to true.' +
    `Rule 4: The field type must be a string only composed of the following ${BASIC_FIELD_NAMES}.` +
    // Organising fields
    'Guideline 2: "Section" and "Statement" field types are not meant to collect data. It is encouraged to use "Section" to organise the form fields neatly into sections.' +
    'Guideline 3: When you see section headers in the form (an example of a section header is a number eg, 1. followed by a description and a set of fields after before another number eg, 2. and another set of fields follow), you should include a "Section" field with the section header as the "title".' +
    'Guideline 4: When you see the form title in the form, you should also include a "Section" field for the form title.' +
    'Guideline 5: "Statement" can be used to provide details about subsequent form fields or used together with "YesNo" to ask respondent for approval or agreement.' +
    'Rule 5: When "Statement" field is used, the "description" and "required" properties are compulsory and must be provided and the title must be the same as the description. For example, {"fieldType": "Statement", "title": "Input descrtiption text here. Must be included and be non-empty string.", "required": true, "description": "Input descrtiption text here. Must be included and be non-empty string."}. This "description" property is where you provide the paragraph of text.' +
    'Guideline 6: When you see paragraph(s) of text used for providing information only and do not require a user to fill in any data (Eg, entering their name or ticking a checkbox), you should use the "description" key and "Statement" field type to include the paragraph(s) of text. For example, {"fieldType": "Statement", "title": "Paragraph text here.", "required": true, "description": "Paragraph text here."}.' +
    'Rule 6: Instead of using multiple consecutive paragraphs, combine multiple informational paragraphs into a the "description" key of a single "Statement" field as much as possible. For example, if the image has a paragraph: "1. Paragraph text here\n 2. Paragraph text here", a form field {"fieldType": "Statement", "title": "1. Paragraph text here\n 2. Paragraph text here", "required": true, "description": "1. Paragraph text here\n 2. Paragraph text here."} instead of {"fieldType": "Statement", "title": "1. Paragraph text here", "required": true, "description": "1. Paragraph text here."} and {"fieldType": "Statement", "title": "2. Paragraph text here", "required": true, "description": "2. Paragraph text here."} must be included in the generated form fields since it combines the related paragraphs into a single statement field.' +
    'Guideline 7: "Number" is used to collect whole numbers and "Decimal" for decimal numbers, an example of "Decimal" usage is to represent money amount' +
    // Choices fields
    'Rule 7: If "Dropdown", "Radio" or "Checkbox" field types are used, the json object must include an additional property named "fieldOptions" that is an array of strings for the respondent to select from. For example, {"fieldType": "Checkbox", "title": "Selected language", "required": true, "description": "Dropdown description", "fieldOptions": ["Chinese", "Malay", "Tamil"]}.' +
    'Guideline 8: When you see checkboxes in the form, you should group relevant checkbox options, which are usually found in close proximity to each other, in the "fieldOptions" string array under the same "Checkbox" field with an appropriate title.' +
    'Guideline 9: When you see radio options in the form, you should group relevant radio options, which are usually found in close proximity to each other, in the "fieldOptions" string array under the same "Radio" field with an appropriate title.' +
    'Guideline 10: "Yes/No" is used to collect a boolean response, for example, whether the respondent approves to something or agrees to the text. For example, {"fieldType": "YesNo", "title": "Text from the form describing what the respondent is agreeing to", "required": true, "description": "Provide any additional text from the form here if needed."}.' +
    'Guideline 11: When you see text asking for agreement to terms in the form, you should a "Yes/No" field for the respondent to accept or deny, where the title includes the terms and conditions they are saying yes or no to.' +
    // Rating field
    'Guideline 12: "Rating" can be used to collect a rating from 1 to 5, for example, to rate the satisfaction level of a service.' +
    // Id fields
    'Guideline 13: "Nric" is used to collect the unique identity number issued to each respondent, it can be used to uniquely identify the respondent.' +
    'Guideline 14: "Uen" is a unique identifier for businesses, it can be used to uniquely identify a business.' +
    // Mobile and home number fields
    'Guideline 15: "Mobile" is used to collect a mobile phone number. "HomeNo" is used to collect a home phone number.' +
    // Attachment field
    'Guideline 16: "Attachment is used for the respondent to upload files.' +
    // Table field
    'Guideline 17: "Table is used for the respondent to fill in a table of data. "Table" can be used for when the respondent needs to add an unknown number of rows to their form response.' +
    'Rule 8: When you spot anything that resembles a table in the form, such as a rectangular grid with empty cells to fill in, you must use the "Table" field.' +
    'Rule 9: If "Table" is used, the "columns" property must be provided in the json and be an array of strings. There must also be integer "minimumRows" and boolean "addMoreRows" properties which defines whether the respondent can add more rows when responding and an optional integer "maximumRows" property. For example, {"fieldType": "Table", "title": "Table title", "required": true, "description": "Table description", "columns": ["Column 1", "Column 2", "Column 3"], "minimumRows": 1, "addMoreRows": true, "maximumRows": 10}.' +
    'Rule 10: Do not duplicate text that is already represented in another field if it does not show up multiple times in the image. For example, if the image has a single text: "Name: " with a box for respondent to fill close to it, generate a {"fieldType": "ShortText", "title": "Name", "required": true} as appropriate, but do not duplicate and generate a {"fieldType": "Statement", "title": "Name: ", description: "Name: ", "required": true} as a separate field since it duplicates the text already represented in another field.' +
    'Guideline 18: "Address" is used to collect the address of the respondent.',
}

const generateFormCreationVisionPrompt = ({
  imageDataUrls,
}: {
  imageDataUrls: string[]
}) => {
  const imageUrlContents = imageDataUrls.map((dataUrl) => {
    return {
      type: 'image_url',
      image_url: {
        url: dataUrl,
      },
    }
  })
  const userPrompt = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `The JSON object containing "fields" key which contains an array of form fields that exactly recreates the form depicted in the image without omitting any text and definitely follows all the given rules and guidelines is `,
      },
      ...imageUrlContents,
    ],
  }
  return [
    FORM_DETAILS_VISION_PROMPT,
    userPrompt,
    VERIFICATION_PROMPT,
  ] as Message[]
}

const generateAndSendVisionPromptToModel = ({
  formId,
  imageDataUrls,
}: {
  formId: string
  imageDataUrls: string[]
}) => {
  const messages = generateFormCreationVisionPrompt({ imageDataUrls })
  return sendPromptToModel({
    messages,
    formId,
    options: {
      response_format: {
        type: 'json_object',
      },
    },
  }).mapErr((error) => {
    logger.error({
      message: 'Error when generating response from model',
      meta: { action: 'sendPromptToModel' },
      error,
    })
    return error
  })
}

/**
 * Creates form fields using vision prompts from image data URLs
 * @param form The form to create fields for
 * @param imageDataUrls Array of image data URLs to analyze
 * @returns ok(array of created field IDs) if successful
 * @returns err(ModelResponseFailureError) if model fails to generate response
 * @returns err(ModelResponseInvalidSyntaxError) if model response is not valid JSON
 * @returns err(ModelResponseInvalidSchemaFormatError) if model response does not match expected schema
 */
export const createFormFieldsUsingVisionPrompt = ({
  form,
  imageDataUrls,
}: {
  form: IPopulatedForm
  imageDataUrls: string[]
}): ResultAsync<
  FormFieldSchema['_id'][],
  | ModelResponseFailureError
  | ModelResponseInvalidSchemaFormatError
  | ModelResponseInvalidSyntaxError
  | PossibleDatabaseError
  | FormNotFoundError
  | FieldNotFoundError
> => {
  return generateAndSendVisionPromptToModel({
    formId: form.id,
    imageDataUrls,
  })
    .andThen((modelResponse) => {
      if (!modelResponse) {
        const modelResponseFailureError = new ModelResponseFailureError()
        logger.error({
          message: 'Error generating response from model',
          meta: {
            action: 'createFormFieldsUsingVisionPrompt',
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
            action: 'createFormFieldsUsingVisionPrompt',
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
            action: 'createFormFieldsUsingVisionPrompt',
            suggestedFormFields,
            error: parseSuggestedFormFieldsResult.error,
          },
        })
        return errAsync(new ModelResponseInvalidSchemaFormatError())
      }

      const parsedSuggestedFormFields = parseSuggestedFormFieldsResult.data
      const formFieldsToCreate = mapSuggestedFormFieldToFieldCreateDto(
        parsedSuggestedFormFields.fields,
      )
      return createFormFields({ form, newFields: formFieldsToCreate, to: 0 })
    })
    .map((updatedFields) => {
      updateFormMetadata(form, {
        ...form.metadata,
        mfb_vision_prompt_count:
          (form.metadata?.mfb_vision_prompt_count ?? 0) + 1,
      })
      return updatedFields.map((field) => field._id)
    })
}
