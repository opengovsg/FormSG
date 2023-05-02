import convict, { Schema } from 'convict'

export interface IGoGov {
  goGovAPIKey: string
}

const goGovSchema: Schema<IGoGov> = {
  goGovAPIKey: {
    doc: 'GoGov API key',
    format: String,
    default: null,
    env: 'GOGOV_API_KEY',
  },
}

export const goGovConfig = convict(goGovSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
