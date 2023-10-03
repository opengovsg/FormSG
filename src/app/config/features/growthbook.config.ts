import convict, { Schema } from 'convict'

export interface IGrowthbook {
  growthbookClientKey: string
}

const growthbookSchema: Schema<IGrowthbook> = {
  growthbookClientKey: {
    doc: 'Growthbook Client Key',
    format: String,
    default: '',
    env: 'GROWTHBOOK_CLIENT_KEY',
  },
}

export const growthbookConfig = convict(growthbookSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
