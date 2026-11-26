import convict, { Schema } from 'convict'

export interface IOneMap {
  email: string
  password: string
  baseUrl: string
}

const oneMapSchema: Schema<IOneMap> = {
  email: {
    doc: 'Email of the OneMap API account used for postal code lookups',
    format: String,
    default: '',
    env: 'ONEMAP_EMAIL',
  },
  password: {
    doc: 'Password of the OneMap API account used for postal code lookups',
    format: String,
    default: '',
    env: 'ONEMAP_PASSWORD',
    sensitive: true,
  },
  baseUrl: {
    doc: 'OneMap API base URL',
    format: String,
    default: 'https://www.onemap.gov.sg',
    env: 'ONEMAP_BASE_URL',
  },
}

export const oneMapConfig = convict(oneMapSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
