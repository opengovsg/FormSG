import convict, { Schema } from 'convict'

export interface azureOpenAI {
  apiKey: string
  endpoint: string
  deploymentId: string
}

const azureOpenAISchema: Schema<azureOpenAI> = {
  apiKey: {
    doc: 'Azure OpenAI API key',
    format: String,
    default: 'TEST_OPENAI_API_KEY',
    env: 'AZURE_OPENAI_API_KEY',
  },
  endpoint: {
    doc: 'Azure OpenAI endpoint',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_ENDPOINT',
  },
  deploymentId: {
    doc: 'Azure OpenAI Deployment ID',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_DEPLOYMENT_ID',
  },
}

export const azureOpenAIConfig = convict(azureOpenAISchema)
  .validate({
    allowed: 'strict',
  })
  .getProperties()
