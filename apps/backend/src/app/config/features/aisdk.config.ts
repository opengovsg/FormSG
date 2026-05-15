import convict, { Schema } from 'convict'

export interface IAiSdk {
  providerName: string
  apiKey: string
  baseUrl: string
  modelName: string
}

const aisdkSchema: Schema<IAiSdk> = {
  providerName: {
    doc: 'Name of the engine to use',
    format: String,
    default: '',
    env: 'AI_SDK_PROVIDER_NAME',
  },
  baseUrl: {
    doc: 'Base URL of the engine',
    format: String,
    default: '',
    env: 'AI_SDK_BASE_URL',
  },
  apiKey: {
    doc: 'API key of the engine',
    format: String,
    default: '',
    env: 'AI_SDK_API_KEY',
  },
  modelName: {
    doc: 'Name of the model to use',
    format: String,
    default: '',
    env: 'AI_SDK_MODEL_NAME',
  },
}

export const aisdkConfig = convict(aisdkSchema)
  .validate({
    allowed: 'strict',
  })
  .getProperties()
