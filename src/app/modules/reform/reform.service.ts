const expectedFormFieldSchemaFormat =
  '---\n<JSON schema; array of form fields>\n---'

const expectedQuestionsListFormat =
  '---\n1. <question> | <answer type>\n2. ...\n---'

export const schemaPromptBuilder = (schema: any) => {
  const prompt = `I am a form builder that has the possible form field schemas in the following list:\n
  ${JSON.stringify(schema)}
  Please keep any null values in the schema as null, and false values in the schema as false.`
  return prompt
}

export const formFieldsPromptBuilder = (
  purpose: string,
  questions: string,
  formName: string,
) => {
  const prompt = `${
    purpose ? `Help me generate a form that ${purpose}. ` : ''
  }This form has the name ${formName}.
  I have the following list of questions:
  ${questions}

  Present the questions as form fields in JSON (list of form field schemas), in the form of "${expectedFormFieldSchemaFormat}" as defined by the system, without any code blocks. Format the JSON as a single line.`
  return prompt
}

export const questionListPromptBuilder = (purpose: string) => {
  const prompt = `I am a public officer who wants to create a form that ${purpose}.
  Give me a list of content / questions I should have in my form built with this form builder, in the form of "${expectedQuestionsListFormat}".`
  return prompt
}

export const migratePromptBuilder = (parsedContent: string) => {
  const prompt = `Help me generate the corresponding JSON form fields from content parsed from a PDF document.
  Here is the parsed content from the PDF document (wrapped in triple quotes):
  """
  ${parsedContent}
  """

  Based on the parsed content, extract content that should be added to the form builder form and present them as a list, in the form of "${expectedQuestionsListFormat}".`
  return prompt
}
