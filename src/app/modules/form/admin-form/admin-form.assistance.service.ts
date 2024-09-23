import { Role, sendUserTextPrompt } from './ai-model'

const generateFormCreationPrompt = (userPrompt: string) => {
  const messages = [
    {
      role: Role.System,
      content:
        'You will make a form for the purpose described in the next prompt.' +
        'Your next response must be an array of objects with property fieldName and fieldType.' +
        'The fieldTypes supported must be one of the following [short text, long text, date, checkbox, radio]' +
        'There must be at most 5 form fields in the form.',
    },
    {
      role: Role.User,
      content: `Create a form that collects ${userPrompt}`,
    },
  ]

  return messages
}

export const sendPromptToModel = async (prompt: string) => {
  const messages = generateFormCreationPrompt(prompt)
  return await sendUserTextPrompt({ messages })
}
