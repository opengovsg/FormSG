import convict from 'convict'

const isDev = process.env.NODE_ENV === 'development'

const isTest = process.env.NODE_ENV === 'test'

export const config = convict({
  environment: {
    env: 'NODE_ENV',
    format: ['development', 'staging', 'uat', 'production', 'test'],
    default: 'development',
  },
  isTestOrDev: {
    default: isDev || isTest,
  },
  backend: {
    url: {
      env: 'BACKEND_API_URL',
      default: 'http://host.docker.internal:8080/api',
      format: String,
    },
    apiKey: {
      env: 'BACKEND_API_KEY',
      required: true,
      sensitive: true,
      default: '',
      format: String,
    },
  },
})
  .validate()
  .getProperties()
