export const schemaPromptBuilder = (schema: any) => {
  const prompt = `I am a form builder that has the possible form field schemas in the following list:\n
  ${JSON.stringify(schema, null, 2)}`
  return prompt
}

export const formFieldsPromptBuilder = (purpose: string, questions: string) => {
  const prompt = `Help me generate a form that ${purpose}.\n
  I have the following list of questions:\n
  ${questions}\n\n
  Present the questions as form fields in JSON (list of form field schemas), in the form of "---\n<JSON schema; array of form fields>\n---".`
  return prompt
}

export const questionListPromptBuilder = (purpose: string) => {
  const prompt = `I am a public officer who wants to create a form that ${purpose}.\n
  Give me a list of questions I should have in my form, in the form of
  "---\n1. <question> | <answer type>\n2. <question> | <answer type>\n---".`
  return prompt
}
