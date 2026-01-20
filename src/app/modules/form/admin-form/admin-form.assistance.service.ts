import { omit } from 'lodash'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
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
import { azureOpenAIConfig } from '../../../config/features/azureopenai.config'
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
    formId: form._id,
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
    formId: form._id,
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

/**
 * Request interface for interpret data - only fieldId and answer from client
 */
interface InterpretDataRequestField {
  fieldId: string
  answer: string
}

interface InterpretDataRequestResponse {
  refNo: string
  submissionTime: string
  fields: InterpretDataRequestField[]
}

/**
 * Field schema extracted once from the form
 */
interface FieldSchema {
  fieldId: string
  question: string
  fieldType: string
  description?: string
  fieldOptions?: string[]
}

/**
 * Result of analyzing a question to determine relevant fields
 */
interface AnalyzeQuestionResult {
  relevantFieldIds: string[]
  suggestedFilters: Array<{
    fieldId: string
    operator: 'contains' | 'equals'
    value: string
  }>
  reasoning: string
}

const ANALYZE_QUESTION_SYSTEM_PROMPT = {
  role: Role.System,
  content:
    'You are an assistant that analyzes user questions about form response data. ' +
    'Given a question and a list of form fields, determine which fields are relevant to answering the question. ' +
    'Also suggest any filters that should be applied to narrow down the data. ' +
    'You must respond with a valid JSON object containing exactly these three keys: ' +
    '"relevantFieldIds": an array of strings (field IDs) that are needed to answer the question. Include all field IDs if the question is broad like "summarize all responses". ' +
    '"suggestedFilters": an array of objects, each with "fieldId" (string), "operator" (either "contains" or "equals"), and "value" (string). Only include filters if the question clearly implies filtering like "responses where X contains Y". Leave as empty array [] if no filters are needed. Filters are combined with logical AND, and only one filter may be applied per field/column. Do NOT propose multiple filters for the same field. ' +
    '"reasoning": a concise string (maximum 50 words) explaining why these fields were selected. Keep it brief and to the point. ' +
    'IMPORTANT FILTERING RULES: ' +
    '1. Filters are ANDed together; there is no OR. At most one filter per field/column. Avoid duplicate filters on the same field. ' +
    '2. For free text fields (ShortText/textfield, LongText/textarea): Only suggest filters when there is HIGH CERTAINTY the filter will not exclude relevant answers due to varied wording, synonyms, or paraphrases. ' +
    '3. Avoid free-text filters for generic concepts/keywords (e.g., "brother", "sibling", "good", "bad", "happy") because respondents may use synonyms or related terms. Only suggest a free-text filter if the user explicitly asks for an exact match/contains on a specific literal phrase (e.g., the user includes quotes like "John Smith" or requests exact value), or if the value looks like a unique identifier/code (e.g., contains digits) or a full name/phrase (multiple words). ' +
    '4. Free text fields have varied wording - be very cautious. Prefer returning no filter [] over a risky filter. ' +
    '5. For structured fields (Radio, Checkbox, Dropdown, YesNo): You can suggest filters more freely as these have predefined options. ' +
    '6. Be conservative with filters - only suggest them when the question clearly implies filtering and you have high certainty about the filter value. ' +
    '7. For general questions like "what are the trends?", "summarize the data", or "analyze responses", include all field IDs and an empty filters array. ' +
    'Example response: {"relevantFieldIds": ["field1", "field2"], "suggestedFilters": [], "reasoning": "These fields contain the data needed to answer the question."}',
}

const analyzeQuestionResultSchema = z.object({
  relevantFieldIds: z.array(z.string()),
  suggestedFilters: z.array(
    z.object({
      fieldId: z.string(),
      operator: z.enum(['contains', 'equals']),
      value: z.string(),
    }),
  ),
  reasoning: z.string(),
})

// ============================================
// Suggested Questions (LLM helper for the UI)
// ============================================

const SUGGEST_SUGGESTED_QUESTIONS_SYSTEM_PROMPT = {
  role: Role.System,
  content:
    'You are an assistant that generates decision-oriented questions for exploring form response data. ' +
    'Given a form title and its field schema, generate up to 3 suggested questions that would help someone make informed decisions based on the data. ' +
    "Focus on questions that reveal insights, patterns, or actionable information relevant to the form's purpose. " +
    'Questions should be: ' +
    '- Specific and answerable from the response data (e.g., counts, distributions, comparisons, trends, correlations) ' +
    '- Decision-oriented (help users understand what actions to take, what patterns exist, or what the data reveals) ' +
    "- Contextually relevant to the form's purpose and field types " +
    '- Concise (under 100 characters each) ' +
    '- Written in natural language without mentioning internal field IDs ' +
    '- Try to use the same terminology as the form fields and form title. For example, if the form title is "User Complaints for Facilities", use "facility" instead of "location".' +
    'Good examples:' +
    'If the form is about user complaints for facilities, "which facility types have the most complaints?"' +
    'If the form is about user satisfaction for products, "which products have the highest satisfaction rating?"' +
    'If the form is a feedback form, "what is the most common feedback?"',
}

const suggestedQuestionsResultSchema = z.object({
  suggestedQuestions: z
    .array(z.string())
    .min(1)
    .max(3)
    .transform((qs) =>
      Array.from(
        new Set(
          qs
            .map((q) => q.trim())
            .filter((q) => q.length > 0 && q.length <= 100)
            .map((q) => q.slice(0, 100)),
        ),
      ).slice(0, 3),
    ),
})

const suggestedQuestionsJsonSchema = {
  name: 'suggested_questions_result',
  strict: true,
  schema: {
    type: 'object',
    description:
      'The result containing suggested questions for exploring form response data.',
    properties: {
      suggestedQuestions: {
        type: 'array',
        description:
          "An array of up to 3 decision-oriented questions that help users explore and make decisions based on the form response data. Each question should be specific, answerable from the data, and relevant to the form's purpose. Maximum 3 questions, each under 100 characters.",
        items: {
          type: 'string',
          description:
            'A specific, decision-oriented question that can be answered from the form response data. Should be concise (under 100 characters) and help users gain actionable insights.',
        },
        minItems: 1,
        maxItems: 3,
      },
    },
    required: ['suggestedQuestions'],
    additionalProperties: false,
  },
} as const

const generateSuggestedQuestionsPrompt = ({
  formName,
  fieldSchemas,
}: {
  formName: string
  fieldSchemas: FieldSchema[]
}): Message[] => {
  const fieldsDescription = fieldSchemas
    .map((field) => {
      const parts = [
        `- Field ID: "${field.fieldId}"`,
        `  Question: "${field.question}"`,
        `  Type: ${field.fieldType}`,
      ]
      if (field.description) {
        parts.push(`  Description: ${field.description}`)
      }
      if (field.fieldOptions && field.fieldOptions.length > 0) {
        parts.push(`  Options: ${field.fieldOptions.join(', ')}`)
      }
      return parts.join('\n')
    })
    .join('\n')

  return [
    SUGGEST_SUGGESTED_QUESTIONS_SYSTEM_PROMPT,
    {
      role: Role.User,
      content: `Form Title: "${formName}"\n\nForm Field Schema:\n${fieldsDescription}\n\nGenerate up to 3 decision-oriented questions that would help someone explore this form's response data and make informed decisions. Consider the form's purpose, field types, and what insights would be most valuable.`,
    },
  ] as Message[]
}

export type SuggestedQuestionsResult = {
  suggestedQuestions: string[]
}

export const generateSuggestedQuestions = ({
  form,
}: {
  form: IPopulatedForm
}): ResultAsync<
  SuggestedQuestionsResult,
  | ModelResponseFailureError
  | ModelGetClientFailureError
  | ModelResponseInvalidSyntaxError
  | ModelResponseInvalidSchemaFormatError
> => {
  const formId = form._id.toString()

  if (!form.form_fields || form.form_fields.length === 0) {
    return okAsync({ suggestedQuestions: [] })
  }

  const fieldSchemas: FieldSchema[] = form.form_fields
    .filter((field) => field._id && field.title)
    .map((field) => {
      let fieldOptions: string[] | undefined
      if ('fieldOptions' in field && Array.isArray(field.fieldOptions)) {
        fieldOptions = field.fieldOptions
      }
      return {
        fieldId: field._id.toString(),
        question: field.title,
        fieldType: field.fieldType,
        description: field.description || undefined,
        fieldOptions,
      }
    })

  if (fieldSchemas.length === 0) {
    return okAsync({ suggestedQuestions: [] })
  }

  const messages = generateSuggestedQuestionsPrompt({
    formName: form.title,
    fieldSchemas,
  })

  return sendPromptToModel({
    messages,
    formId,
    options: {
      response_format: {
        type: 'json_schema',
        json_schema: suggestedQuestionsJsonSchema,
      },
    },
  }).andThen((modelResponse) => {
    if (!modelResponse) {
      return errAsync(new ModelResponseFailureError())
    }

    let parsedJson
    try {
      parsedJson = JSON.parse(modelResponse)
    } catch (error) {
      return errAsync(
        new ModelResponseInvalidSyntaxError(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      )
    }

    const validationResult =
      suggestedQuestionsResultSchema.safeParse(parsedJson)
    if (!validationResult.success) {
      return errAsync(
        new ModelResponseInvalidSchemaFormatError(
          `Invalid response format: ${validationResult.error.errors.map((e) => e.message).join('; ')}`,
        ),
      )
    }

    return okAsync({
      suggestedQuestions: validationResult.data.suggestedQuestions,
    })
  })
}

const generateAnalyzeQuestionPrompt = ({
  question,
  fieldSchemas,
}: {
  question: string
  fieldSchemas: FieldSchema[]
}): Message[] => {
  const fieldsDescription = fieldSchemas
    .map((field) => {
      const parts = [
        `- ID: "${field.fieldId}", Question: "${field.question}", Type: ${field.fieldType}`,
      ]
      if (field.fieldOptions && field.fieldOptions.length > 0) {
        parts.push(`  Options: ${field.fieldOptions.join(', ')}`)
      }
      return parts.join('\n')
    })
    .join('\n')

  return [
    ANALYZE_QUESTION_SYSTEM_PROMPT,
    {
      role: Role.User,
      content: `Available form fields:\n${fieldsDescription}\n\nUser question: "${question}"\n\nAnalyze which fields are relevant and if any filters should be applied. Respond with JSON:`,
    },
  ] as Message[]
}

/**
 * Analyzes a user question to determine which form fields are relevant
 * and what filters should be applied before sending data for interpretation.
 * This is Step 1 of the 2-step interpretation flow.
 */
export const analyzeQuestionForRelevantFields = ({
  form,
  question,
}: {
  form: IPopulatedForm
  question: string
}): ResultAsync<
  AnalyzeQuestionResult,
  | ModelResponseFailureError
  | ModelGetClientFailureError
  | ModelResponseInvalidSyntaxError
  | ModelResponseInvalidSchemaFormatError
> => {
  const formId = form._id.toString()

  // Check if form has fields
  if (!form.form_fields || form.form_fields.length === 0) {
    logger.error({
      message: 'Form has no fields to analyze',
      meta: {
        action: 'analyzeQuestionForRelevantFields',
        formId,
      },
    })
    return errAsync(
      new ModelResponseFailureError(
        'Form has no fields. Please add fields to the form before analyzing questions.',
      ),
    )
  }

  // Build field schemas from form
  const fieldSchemas: FieldSchema[] = form.form_fields
    .filter((field) => field._id && field.title) // Filter out invalid fields
    .map((field) => {
      let fieldOptions: string[] | undefined
      if ('fieldOptions' in field && Array.isArray(field.fieldOptions)) {
        fieldOptions = field.fieldOptions
      }
      return {
        fieldId: field._id.toString(),
        question: field.title,
        fieldType: field.fieldType,
        description: field.description || undefined,
        fieldOptions,
      }
    })

  // If no valid fields after filtering, return error
  if (fieldSchemas.length === 0) {
    logger.error({
      message: 'No valid fields found in form',
      meta: {
        action: 'analyzeQuestionForRelevantFields',
        formId,
      },
    })
    return errAsync(
      new ModelResponseFailureError(
        'No valid fields found in form. Please ensure fields have valid IDs and titles.',
      ),
    )
  }

  const messages = generateAnalyzeQuestionPrompt({
    question,
    fieldSchemas,
  })

  logger.info({
    message: 'Analyzing question for relevant fields',
    meta: {
      action: 'analyzeQuestionForRelevantFields',
      formId,
      questionLength: question.length,
      numFields: fieldSchemas.length,
    },
  })

  return sendPromptToModel({
    messages,
    formId,
    options: {
      response_format: {
        type: 'json_object',
      },
    },
  })
    .mapErr((error) => {
      logger.error({
        message:
          'Error from sendPromptToModel in analyzeQuestionForRelevantFields',
        meta: {
          action: 'analyzeQuestionForRelevantFields',
          formId,
          errorMessage: error.message,
        },
        error,
      })
      return error
    })
    .andThen((modelResponse) => {
      if (!modelResponse) {
        const modelResponseFailureError = new ModelResponseFailureError()
        logger.error({
          message: 'Error generating response from model for question analysis',
          meta: {
            action: 'analyzeQuestionForRelevantFields',
            formId,
            error: modelResponseFailureError,
          },
        })
        return errAsync(modelResponseFailureError)
      }

      logger.info({
        message: 'Received model response for question analysis',
        meta: {
          action: 'analyzeQuestionForRelevantFields',
          formId,
          responseLength: modelResponse?.length || 0,
          responsePreview: modelResponse?.substring(0, 200),
        },
      })

      let parsedJson
      try {
        parsedJson = JSON.parse(modelResponse)
      } catch (error) {
        logger.error({
          message: 'Error parsing question analysis response as JSON',
          meta: {
            action: 'analyzeQuestionForRelevantFields',
            formId,
            modelResponse,
            error,
          },
        })
        return errAsync(
          new ModelResponseInvalidSyntaxError(
            `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        )
      }

      const validationResult = analyzeQuestionResultSchema.safeParse(parsedJson)

      if (!validationResult.success) {
        logger.error({
          message: 'Question analysis response does not match expected schema',
          meta: {
            action: 'analyzeQuestionForRelevantFields',
            formId,
            parsedJson,
            error: validationResult.error,
            errorDetails: validationResult.error.errors,
          },
        })
        return errAsync(
          new ModelResponseInvalidSchemaFormatError(
            `Invalid response format: ${validationResult.error.errors.map((e) => e.message).join('; ')}`,
          ),
        )
      }

      // Filter to only include valid field IDs that exist in the form
      const validFieldIds = new Set(fieldSchemas.map((f) => f.fieldId))

      // Create a map of fieldId to fieldType for validation
      const fieldTypeMap = new Map(
        fieldSchemas.map((f) => [f.fieldId, f.fieldType]),
      )

      // Free text field types that should not be filtered unless explicitly requested
      const freeTextFieldTypes = [BasicField.ShortText, BasicField.LongText]

      // Check if question explicitly requests filtering (contains words like "where", "filter", "containing", "with", "that have")
      const questionLower = question.toLowerCase()
      const explicitFilterKeywords = [
        'where',
        'filter',
        'containing',
        'with',
        'that have',
        'that contain',
        'equal to',
        'equals',
        'equal',
      ]
      const hasExplicitFilterRequest = explicitFilterKeywords.some((keyword) =>
        questionLower.includes(keyword),
      )

      // Treat quoted text in the question as a stronger explicit intent to match a literal phrase.
      const hasQuotedPhrase =
        /"[^"]{2,}"/.test(question) || /'[^']{2,}'/.test(question)

      // Generic single-word concepts are especially risky for free-text filtering due to synonyms/paraphrases.
      // Examples: "brother" vs "sibling", "kid" vs "child", etc.
      const genericFreeTextStopWords = new Set([
        'brother',
        'sister',
        'sibling',
        'siblings',
        'family',
        'mother',
        'father',
        'mum',
        'mom',
        'dad',
        'parent',
        'parents',
        'child',
        'children',
        'kid',
        'kids',
        'son',
        'daughter',
        'happy',
        'sad',
        'good',
        'bad',
        'yes',
        'no',
      ])

      // Validate suggested filters - allow free text filters if value seems specific enough
      const safeSuggestedFilters =
        validationResult.data.suggestedFilters.filter((filter) => {
          // Must be a valid field ID
          if (!validFieldIds.has(filter.fieldId)) {
            return false
          }

          const fieldType = fieldTypeMap.get(filter.fieldId)
          if (!fieldType) {
            return false
          }

          // For free text fields, check if the filter value seems specific enough
          // (indicating high certainty from the LLM)
          if (freeTextFieldTypes.includes(fieldType as BasicField)) {
            const filterValue = filter.value.trim()
            const normalized = filterValue.toLowerCase()
            const isSingleWord = !/\s/.test(filterValue)
            const isGenericSingleWord =
              isSingleWord && genericFreeTextStopWords.has(normalized)

            if (
              isGenericSingleWord &&
              !(hasExplicitFilterRequest || hasQuotedPhrase)
            ) {
              logger.info({
                message:
                  'Removed filter on free text field (generic single-word value; likely to exclude synonyms/paraphrases)',
                meta: {
                  action: 'analyzeQuestionForRelevantFields',
                  formId,
                  fieldId: filter.fieldId,
                  fieldType,
                  filterValue,
                  question,
                },
              })
              return false
            }

            // Allow if: explicit filter request OR value seems specific (longer, contains numbers/codes, or multiple words)
            const seemsSpecific =
              filterValue.length >= 5 || // At least 5 characters
              /[0-9]/.test(filterValue) || // Contains numbers (likely codes/IDs)
              filterValue.split(/\s+/).length >= 2 || // Multiple words (likely full names/phrases)
              hasExplicitFilterRequest ||
              hasQuotedPhrase

            if (!seemsSpecific) {
              logger.info({
                message:
                  'Removed filter on free text field (value not specific enough)',
                meta: {
                  action: 'analyzeQuestionForRelevantFields',
                  formId,
                  fieldId: filter.fieldId,
                  fieldType,
                  filterValue,
                  question,
                },
              })
              return false
            }
          }

          return true
        })

      const filteredResult: AnalyzeQuestionResult = {
        relevantFieldIds: validationResult.data.relevantFieldIds.filter((id) =>
          validFieldIds.has(id),
        ),
        suggestedFilters: safeSuggestedFilters,
        reasoning: validationResult.data.reasoning,
      }

      // If no relevant fields found, include all fields
      if (filteredResult.relevantFieldIds.length === 0) {
        filteredResult.relevantFieldIds = Array.from(validFieldIds)
      }

      return okAsync(filteredResult)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error when analyzing question for relevant fields',
        meta: { action: 'analyzeQuestionForRelevantFields', formId },
        error,
      })
      return error
    })
}

const INTERPRET_DATA_SYSTEM_PROMPT = {
  role: Role.System,
  content:
    'You will be given a set of form responses and a question about the data. ' +
    'You will also receive the form field schema which includes field types (e.g., ShortText, Radio, Checkbox, Dropdown, Number, Email, etc.), descriptions, and available options for choice fields. ' +
    'Use this schema information to better understand the context and constraints of each field when analyzing the data. ' +
    'Analyze the responses and provide a structured answer in JSON format with four required keys: "answer", "explanation", "mentionedResponseIds", and "suggestedCharts". ' +
    'The "answer" key must be as concise as possible which answers the question to the point. ' +
    'The "explanation" key should contain the reasoning, methodology, breakdown, or additional context that supports the answer. Keep the explanation concise and within 300 words. Focus on the most important details that support your answer. ' +
    'The "mentionedResponseIds" key must ALWAYS be present and must be an array. ' +
    'IMPORTANT: Only include response IDs in "mentionedResponseIds" when your answer specifically refers to individual responses by their ID (refNo). ' +
    'For general summaries, statistics, trends, aggregations, or answers that apply to multiple responses without specifically identifying them, use an empty array []. ' +
    'ONLY include response IDs when: the question asks for specific responses, you are highlighting particular responses by their ID, or you are providing examples of specific responses. ' +
    'When including response IDs, list the exact refNo values that are mentioned in your answer. ' +
    'The "suggestedCharts" key must ALWAYS be present and must be an array. ' +
    'IMPORTANT: Charts are optional. Only suggest charts when they would be helpful for visualizing distributions, comparisons, patterns, or trends in the data. If charts are not useful, return an empty array []. ' +
    "DO NOT suggest charts for: simple yes/no answers, single values, answers that don't benefit from visualization, or when the data is too sparse. " +
    'DO suggest charts for: distribution questions (e.g., "How many selected each option?"), comparison questions (e.g., "Compare responses across categories"), pattern questions (e.g., "What are the common themes?"), trend questions (e.g., "How did responses change over time?"), or when showing multiple data points would clarify the answer. ' +
    'CHART TYPE SELECTION GUIDE - Choose the appropriate chart type based on what you want to show: ' +
    '- "pie": Use for composition/parts of a whole. Shows how different categories contribute to a total (e.g., percentage breakdown, proportion of responses by category). ' +
    '- "bar": Use for horizontal comparison of values across categories. Good for comparing multiple categories side-by-side. ' +
    '- "column": Use for vertical comparison of values across categories. Good for comparing rankings, counts, or values across different groups. ' +
    '- "line": Use for trends over time. Shows how values change across time periods, dates, or sequential data points (e.g., submissions per day, responses by month, trends over weeks). ' +
    'Each chart specification must include: chartType (one of: pie, bar, column, line), title (descriptive title explaining what the chart shows), and data (array of objects with "label" and "value" properties). ' +
    'The data array should contain the actual values you want to visualize. For time-based line charts, labels should be time periods (e.g., "2024-01", "Week 1", "Day 1"). ' +
    'Example: [{"label": "Option A", "value": 21}, {"label": "Option B", "value": 18}, {"label": "Option C", "value": 11}]. ' +
    'Focus on providing insights, summaries, patterns, or specific information as requested. ' +
    'If the question asks for statistics, provide accurate calculations. ' +
    'If the question is unclear or cannot be answered with the given data, explain why in the explanation field and provide "Unable to determine" as the answer. ' +
    'Do not suggest additional actions or offers to do more. ' +
    'Format the explanation using markdown for readability. ' +
    'Example responses: ' +
    '{"answer": "42% of respondents selected Option A.", "explanation": "Out of the total 50 responses, 21 chose Option A, which constitutes 42%.\\n\\nDetailed breakdown:\\n- Option A: 21 responses (42%)\\n- Option B: 18 responses (36%)\\n- Option C: 11 responses (22%)\\n\\nThis shows that Option A was the most preferred, receiving the highest share of selections.", "mentionedResponseIds": [], "suggestedCharts": [{"chartType": "pie", "title": "Response Distribution by Option", "data": [{"label": "Option A", "value": 21}, {"label": "Option B", "value": 18}, {"label": "Option C", "value": 11}]}]} ' +
    '{"answer": "15 responses submitted after 5pm, representing 30% of all responses.", "explanation": "By analyzing submission times, 15 out of 50 responses were submitted after 5pm. This could indicate higher engagement in the evening.\\n\\nCalculation:\\n- Total responses: 50\\n- Responses after 5pm: 15 (30%)\\n- Responses before 5pm: 35 (70%)", "mentionedResponseIds": [], "suggestedCharts": []} ' +
    '{"answer": "New user sentiment: positive. Existing user sentiment: mixed.", "explanation": "Among new users, 78% of feedback comments reflected positive language such as \\"satisfied\\", \\"helpful\\", and \\"efficient\\", indicating strong satisfaction. In contrast, existing users provided more varied feedback, suggesting areas for further improvement.\\n\\nThemes identified:\\n- New users: Positive experiences\\n- Existing users: Mixed sentiments\\n\\nRecommendation: Focus on addressing specific concerns raised by existing users to improve overall satisfaction.", "mentionedResponseIds": [], "suggestedCharts": [{"chartType": "bar", "title": "User Sentiment by User Type", "data": [{"label": "New Users - Positive", "value": 78}, {"label": "Existing Users - Mixed", "value": 45}]}]} ' +
    '{"answer": "Submissions increased steadily from January to March, with a peak in February.", "explanation": "Analysis of submission dates shows a clear upward trend. January had 12 submissions, February peaked at 28 submissions, and March had 22 submissions. This indicates growing engagement over the quarter.\\n\\nMonthly breakdown:\\n- January: 12 submissions\\n- February: 28 submissions\\n- March: 22 submissions", "mentionedResponseIds": [], "suggestedCharts": [{"chartType": "line", "title": "Submission Trend Over Time", "data": [{"label": "January", "value": 12}, {"label": "February", "value": 28}, {"label": "March", "value": 22}]}]} ' +
    '{"answer": "Most responses scored between 7-9, with 45% falling in this range.", "explanation": "The rating distribution shows a concentration in the higher scores. Scores 7-9 account for 45% of all responses, indicating generally positive feedback. Lower scores (1-3) represent only 12% of responses.\\n\\nScore distribution:\\n- 1-3: 12% (6 responses)\\n- 4-6: 43% (22 responses)\\n- 7-9: 45% (23 responses)", "mentionedResponseIds": [], "suggestedCharts": [{"chartType": "histogram", "title": "Rating Score Distribution", "data": [{"label": "1-3", "value": 6}, {"label": "4-6", "value": 22}, {"label": "7-9", "value": 23}]}]}',
}

const generateInterpretDataPrompt = ({
  formName,
  question,
  fieldSchemaMap,
  responses,
}: {
  formName: string
  question: string
  fieldSchemaMap: Map<string, FieldSchema>
  responses: InterpretDataRequestResponse[]
}): Message[] => {
  // Build field schema section from the map (built once from form)
  const fieldSchemas = Array.from(fieldSchemaMap.entries())
    .map(([fieldId, schema]) => {
      const parts = [
        `- Field ID: ${fieldId}`,
        `  Question: ${schema.question}`,
        `  Field Type: ${schema.fieldType}`,
      ]
      if (schema.description) {
        parts.push(`  Description: ${schema.description}`)
      }
      if (schema.fieldOptions && schema.fieldOptions.length > 0) {
        parts.push(`  Options: ${schema.fieldOptions.join(', ')}`)
      }
      return parts.join('\n')
    })
    .join('\n')

  // Format responses, looking up field info from the schema map
  const formattedResponses = responses.map((response) => {
    const fieldAnswers = response.fields
      .map((field) => {
        const schema = fieldSchemaMap.get(field.fieldId)
        const questionText = schema?.question ?? 'Unknown field'
        const fieldType = schema?.fieldType ?? 'Unknown'
        return `  - ${questionText} [${fieldType}]: ${field.answer || '(no answer)'}`
      })
      .join('\n')
    return `Response ID: ${response.refNo}\nSubmission Time: ${response.submissionTime}\nAnswers:\n${fieldAnswers}`
  })

  const dataContent = formattedResponses.join('\n\n---\n\n')

  const schemaSection = fieldSchemas
    ? `\n\nForm Field Schema:\n${fieldSchemas}\n`
    : ''

  return [
    INTERPRET_DATA_SYSTEM_PROMPT,
    {
      role: Role.User,
      content: `Form Name: ${formName}${schemaSection}\nHere are the form responses:\n\n${dataContent}\n\n-----
          Question: ${question}\n\nProvide your response as a JSON object with "answer", "explanation", "mentionedResponseIds", and "suggestedCharts" keys. The "mentionedResponseIds" key should be an array of strings (response IDs) if your answer refers to specific individual responses by their ID. Do NOT include "mentionedResponseIds" for general summaries, statistics, or trends that apply to multiple responses. The "suggestedCharts" key should be an array of chart specifications (each with fieldId, chartType, and optionally title) only when charts would be helpful for visualizing the data. Use empty arrays [] when not applicable.`,
    },
  ] as Message[]
}

/**
 * Zod schema to validate the model response for interpret data.
 * All fields are required. mentionedResponseIds and suggestedCharts should be empty arrays [] when not needed.
 */
const suggestedChartSchema = z.object({
  chartType: z.enum(['pie', 'bar', 'column', 'line']),
  title: z.string(), // Chart title
  data: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
    }),
  ), // Chart data values
})

const interpretDataResultSchema = z.object({
  answer: z.string(),
  explanation: z.string(),
  mentionedResponseIds: z.array(z.string()),
  suggestedCharts: z.array(suggestedChartSchema),
})

type InterpretDataResult = z.infer<typeof interpretDataResultSchema>

/**
 * JSON schema for structured outputs.
 * This ensures the model's response conforms to the expected format.
 * Note: Azure OpenAI requires all properties to be in the required array,
 * so mentionedResponseIds is required but can be an empty array when not needed.
 */
const interpretDataResultJsonSchema = {
  name: 'interpret_data_result',
  strict: true,
  schema: {
    type: 'object',
    description:
      'The result of interpreting form response data based on a user question.',
    properties: {
      answer: {
        type: 'string',
        description:
          'A concise, direct answer to the question. Should be brief and to the point.',
      },
      explanation: {
        type: 'string',
        description:
          'Detailed reasoning, methodology, breakdown, or additional context that supports the answer. Use markdown formatting for readability.',
      },
      mentionedResponseIds: {
        type: 'array',
        description:
          'Array of response IDs (refNo) that are specifically mentioned or referenced in the answer. Include response IDs only when your answer refers to specific individual responses by their ID. For general summaries, statistics, or trends, use an empty array [].',
        items: {
          type: 'string',
        },
      },
      suggestedCharts: {
        type: 'array',
        description:
          'Array of chart specifications to help visualize the data. Only include charts when they would be helpful for understanding distributions, comparisons, or patterns in the data. For simple answers or when charts would not add value, use an empty array []. Each chart should specify: chartType (pie, bar, or column), title (descriptive chart title), and data (array of [label, value] pairs where label is a string and value is a number).',
        items: {
          type: 'object',
          properties: {
            chartType: {
              type: 'string',
              enum: ['pie', 'bar', 'column', 'line'],
              description:
                'Type of chart: pie (for composition/parts of a whole), bar (for horizontal comparison of values), column (for vertical comparison of values), line (for trends over time)',
            },
            title: {
              type: 'string',
              description:
                'Descriptive title for the chart that explains what it shows',
            },
            data: {
              type: 'array',
              description:
                'Array of data points, where each point is an object with "label" (string) and "value" (number). For example: [{"label": "Option A", "value": 21}, {"label": "Option B", "value": 18}].',
              items: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                    description:
                      'The label for this data point (e.g., "Option A", "Category 1")',
                  },
                  value: {
                    type: 'number',
                    description:
                      'The numeric value for this data point (e.g., count, percentage)',
                  },
                },
                required: ['label', 'value'],
                additionalProperties: false,
              },
            },
          },
          required: ['chartType', 'title', 'data'],
          additionalProperties: false,
        },
      },
    },
    required: [
      'answer',
      'explanation',
      'mentionedResponseIds',
      'suggestedCharts',
    ],
    additionalProperties: false,
  },
} as const

/**
 * Builds a field schema map from the form fields.
 * This is done once per request rather than for each response.
 */
const buildFieldSchemaMap = (
  form: IPopulatedForm,
): Map<string, FieldSchema> => {
  const schemaMap = new Map<string, FieldSchema>()

  for (const field of form.form_fields) {
    // Extract field options for choice fields
    let fieldOptions: string[] | undefined
    if ('fieldOptions' in field && Array.isArray(field.fieldOptions)) {
      fieldOptions = field.fieldOptions
    }

    schemaMap.set(field._id.toString(), {
      fieldId: field._id.toString(),
      question: field.title,
      fieldType: field.fieldType,
      description: field.description || undefined,
      fieldOptions,
    })
  }

  return schemaMap
}

/**
 * Interprets form response data using AI based on a user question.
 * Extracts field schema information from the form once to provide context to the AI.
 * @param form The populated form object (used to extract field schema and form name)
 * @param question The question to ask about the data
 * @param responses The decrypted form responses to analyze (with fieldId and answer only)
 * @returns The AI-generated answer split into concise answer and detailed explanation
 */
export const interpretResponseData = ({
  form,
  question,
  responses,
}: {
  form: IPopulatedForm
  question: string
  responses: InterpretDataRequestResponse[]
}): ResultAsync<
  InterpretDataResult,
  | ModelResponseFailureError
  | ModelGetClientFailureError
  | ModelResponseInvalidSyntaxError
  | ModelResponseInvalidSchemaFormatError
> => {
  const formId = form._id.toString()
  const formName = form.title

  // Build field schema map once from form
  const fieldSchemaMap = buildFieldSchemaMap(form)

  const messages = generateInterpretDataPrompt({
    formName,
    question,
    fieldSchemaMap,
    responses,
  })

  logger.info({
    message: 'Interpreting response data with AI',
    meta: {
      action: 'interpretResponseData',
      formId,
      questionLength: question.length,
      numResponses: responses.length,
      usingStructuredOutputs: true,
      apiVersion: azureOpenAIConfig.apiVersion,
    },
  })

  // Try structured outputs (requires API version 2024-08-01-preview or later)
  // If this fails, check server logs for the actual error message
  // Common issues:
  // - API version too old (need 2024-08-01-preview or later)
  // - Invalid schema format
  // - Model doesn't support structured outputs
  return sendPromptToModel({
    messages,
    formId,
    options: {
      response_format: {
        type: 'json_schema',
        json_schema: interpretDataResultJsonSchema,
      },
    },
  })
    .andThen((modelResponse) => {
      if (!modelResponse) {
        const modelResponseFailureError = new ModelResponseFailureError()
        logger.error({
          message:
            'Error generating response from model for data interpretation',
          meta: {
            action: 'interpretResponseData',
            formId,
            error: modelResponseFailureError,
          },
        })
        return errAsync(modelResponseFailureError)
      }

      // With structured outputs, the response should already be valid JSON
      // but we still parse and validate to be safe
      let parsedJson
      try {
        parsedJson = JSON.parse(modelResponse)
      } catch (error) {
        logger.error({
          message: 'Error parsing interpret data response as JSON',
          meta: {
            action: 'interpretResponseData',
            formId,
            modelResponse,
            error,
          },
        })
        return errAsync(
          new ModelResponseInvalidSyntaxError(
            `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        )
      }

      const validationResult = interpretDataResultSchema.safeParse(parsedJson)

      if (!validationResult.success) {
        logger.error({
          message: 'Model response does not match expected schema',
          meta: {
            action: 'interpretResponseData',
            formId,
            parsedJson,
            error: validationResult.error,
            errorDetails: validationResult.error.errors,
          },
        })
        return errAsync(
          new ModelResponseInvalidSchemaFormatError(
            `Invalid response format: ${validationResult.error.errors.map((e) => e.message).join('; ')}`,
          ),
        )
      }

      return okAsync(validationResult.data)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error when interpreting response data with AI',
        meta: {
          action: 'interpretResponseData',
          formId,
          errorType: error.constructor.name,
          errorMessage: error.message,
          apiVersion: azureOpenAIConfig.apiVersion,
        },
        error,
      })
      return error
    })
}
