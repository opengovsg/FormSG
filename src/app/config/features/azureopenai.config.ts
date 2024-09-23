import convict, { Schema } from 'convict'

export interface IAzureOpenAi {
  apiKey: string
  endpoint: string
  deploymentName: string
  apiVersion: string
}

const azureOpenAISchema: Schema<IAzureOpenAi> = {
  apiKey: {
    doc: 'Azure OpenAI API key',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_API_KEY',
  },
  endpoint: {
    doc: 'Azure OpenAI endpoint',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_ENDPOINT',
  },
  deploymentName: {
    doc: 'Azure OpenAI deployment name',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_DEPLOYMENT_NAME',
  },
  apiVersion: {
    doc: 'Azure OpenAI API version',
    format: String,
    default: '',
    env: 'AZURE_OPENAI_API_VERSION',
  },
}

export const azureOpenAIConfig = convict(azureOpenAISchema)
  .validate({
    allowed: 'strict',
  })
  .getProperties()
