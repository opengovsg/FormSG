import convict, { Schema } from 'convict'

import { isTest } from '../config'

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

export const growthbookConfig = isTest
  ? convict(growthbookSchema).getProperties()
  : convict(growthbookSchema).validate({ allowed: 'strict' }).getProperties()
