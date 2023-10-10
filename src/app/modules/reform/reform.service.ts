export const schemaPromptBuilder = (schema: any) => {
  const prompt = `I am a form builder that has the possible form field schemas in the following list:\n
  ${JSON.stringify(schema, null, 2)}`
  return prompt
}

export const userPromptBuilder = (userInput: string) => {
  const prompt = `Help me generate a form to ${userInput}.
  Present the required information in JSON (list of form field schemas), in the form of "---\nJSON schema: <JSON>\n---".`
  return prompt
}
