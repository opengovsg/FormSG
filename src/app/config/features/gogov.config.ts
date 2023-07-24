import convict, { Schema } from 'convict'

export interface IGoGov {
  goGovAPIKey: string
  goGovBaseUrl: string
}

const goGovSchema: Schema<IGoGov> = {
  goGovAPIKey: {
    doc: 'GoGov API key',
    format: String,
    default: '',
    env: 'GOGOV_API_KEY',
  },
  goGovBaseUrl: {
    doc: 'GoGov base URL',
    format: String,
    default: 'https://go.gov.sg',
    env: 'GOGOV_BASE_URL',
  },
}

export const goGovConfig = convict(goGovSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
