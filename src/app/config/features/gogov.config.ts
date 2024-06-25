import convict, { Schema } from 'convict'
import { GOGOV_BASE_URL } from 'shared/constants'

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
    default: GOGOV_BASE_URL,
    env: 'GOGOV_BASE_URL',
  },
}

export const goGovConfig = convict(goGovSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
