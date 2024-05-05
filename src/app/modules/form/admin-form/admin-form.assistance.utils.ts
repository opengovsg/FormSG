// type guard for OpenAIError
import { fieldTypes, sampleFormFields } from './admin-form.assistance.constants'
import { OpenAIError } from './admin-form.assistance.types'

export function isOpenAIError(error: unknown): error is OpenAIError {
  return (
    (error as OpenAIError).message !== undefined &&
    (error as OpenAIError).type !== undefined &&
    (error as OpenAIError).code !== undefined
  )
}

const expectedFormFieldSchemaFormat =
  '---\n<JSON schema; array of form fields>\n---'

const expectedQuestionsListFormat =
  '---\n1. <question> | <answer type>\n2. ...\n---'

export const schemaPromptBuilder = (schema: string) => {
  const prompt = `I am a digital, paperless form builder that has the possible form field schemas in the following list:\n
  ${schema}
  Please keep any null values in the schema as null, and false values in the schema as false. Strictly include all keys in the schema, even if they are null or false.`
  return prompt
}

//Give me a list of content / questions I should have in my form built with this form builder, in the form of "${expectedQuestionsListFormat}". Do not create the question if the <answer type> does not exist in ${fieldTypes}.`

export const questionListPromptBuilder = (purpose: string) => {
  return `I am an administrator who wants to create a digital form that collects ${purpose}.`
}

export const getExpectedQuestionsListTool = {
  name: 'getExpectedQuestions',
  description: `Gets a list of questions to build a form with the specified answerTypes. Ensure all answerTypes exist in the enum. Do not create a question if the answer type does not exist. Signatures should be treated as textfield because an answerType of signature cannot not exist in digital forms.`,
  parameters: {
    type: 'object',
    properties: {
      questionListFormat: {
        type: 'string',
        format: '---\n1. question | answerType\n2. ...\n---',
      },
      answerType: {
        type: 'string',
        enum: fieldTypes,
      },
    },
    required: ['questionListFormat', 'answerType'],
  },
}

export const formFieldsPromptBuilder = (questions: string, schema: string) => {
  return `Help me generate a digital form with the following list of questions: ${questions}
  Provide the questions as form fields for a digital form in JSON format (with the following keys: ${schema}), in the form of "${expectedFormFieldSchemaFormat}" as defined by the system, without any code blocks. Format the JSON as a single line. Ensure the JSON generated only contain fieldTypes of types ${fieldTypes}. Do not create any fieldTypes which are not ${fieldTypes}. Replace values in "<>" with actual primitive values. Do not build the fieldType if a path required is not available.`
}

export const getFormFieldsTool = {
  name: 'getFormFields',
  description: `Gets form fields to build a form with the specified field types based on the example of sample form fields. Do not create fields which do not belong to any of the specified field types. Replace values in "<>" with actual primitive values.`,
  parameters: {
    type: 'object',
    properties: {
      formFieldsFormat: {
        type: 'string',
        format: '---\nJSON schema; array of form fields\n---',
      },
      fieldTypes: {
        type: 'string',
        enum: fieldTypes,
      },
      sampleFormFields: {
        type: 'string',
        format: sampleFormFields,
      },
    },
    required: ['formFieldsFormat', 'fieldType', 'sampleFormFields'],
  },
}

export const migratePromptBuilder = (parsedContent: string) => {
  return `Help me generate the corresponding JSON form fields from content parsed from a PDF document.
  Here is the parsed content from the PDF document (wrapped in triple quotes):
  """
  ${parsedContent}
  """
  Based on the parsed content, extract content that should be added to the form builder form and present them as a list, in the form of "${expectedQuestionsListFormat}". Replace values in <> with actual primitive values.`
}
