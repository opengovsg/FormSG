// type guard for OpenAIError
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
  const prompt = `I am a FormSG, a form builder that has the possible form field schemas in the following list:\n
  ${schema}
  Please keep any null values in the schema as null, and false values in the schema as false. Strictly include all keys in the schema, even if they are null or false.`
  return prompt
}

export const questionListPromptBuilder = (purpose: string) => {
  return `I am a public officer who wants to create a form that collects ${purpose}.
  Give me a list of content / questions I should have in my form built with this form builder, in the form of "${expectedQuestionsListFormat}".`
}

export const formFieldsPromptBuilder = (questions: string) => {
  return `Help me generate a form with the following list of questions: ${questions}
  Present the questions as FormSG form fields in JSON (list of form field schemas), in the form of "${expectedFormFieldSchemaFormat}" as defined by the system, without any code blocks. Format the JSON as a single line.`
}
export const migratePromptBuilder = (parsedContent: string) => {
  return `Help me generate the corresponding JSON form fields from content parsed from a PDF document.
  Here is the parsed content from the PDF document (wrapped in triple quotes):
  """
  ${parsedContent}
  """
  Based on the parsed content, extract content that should be added to the form builder form and present them as a list, in the form of "${expectedQuestionsListFormat}".`
}
