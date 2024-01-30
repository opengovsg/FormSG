import convict, { Schema } from 'convict'

export interface OpenAI {
  apiKey: string
}

const openAISchema: Schema<OpenAI> = {
  apiKey: {
    doc: 'OpenAI API key',
    format: String,
    default: 'TEST_OPENAI_API_KEY',
    env: 'OPENAI_API_KEY',
  },
}

export const openAIConfig = convict(openAISchema)
  .validate({
    allowed: 'strict',
  })
  .getProperties()
