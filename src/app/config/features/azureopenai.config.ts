import convict, { Schema } from 'convict'

export interface IAzureOpenAi {
  apiKey: string
  endpoint: string
}

const azureOpenAISchema: Schema<IAzureOpenAi> = {
  apiKey: {
    doc: 'Azure OpenAI API key',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_ API_KEY',
  },
  endpoint: {
    doc: 'Azure OpenAI endpoint',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_ENDPOINT',
  },
}

export const azureOpenAIConfig = convict(azureOpenAISchema)
  .validate({
    allowed: 'strict',
  })
  .getProperties()
