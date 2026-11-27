import convict, { Schema } from 'convict'

import { isTest } from '../config'

export enum GrowthbookFeature {
  DD_SAMPLE_RATE_ADMIN = 'dd-sample-rate-admin',
  DD_SAMPLE_RATE_PUBLIC = 'dd-sample-rate-public',
}

export interface IGrowthbook {
  growthbookClientKey: string
  growthbookApiHost: string
  enableStepLoginPreview: boolean
}

const growthbookSchema: Schema<IGrowthbook> = {
  enableStepLoginPreview: {
    doc: 'Local step login preview. Applied only in the development environment.',
    format: Boolean,
    default: false,
    env: 'ENABLE_STEP_LOGIN_PREVIEW',
  },
  growthbookClientKey: {
    doc: 'Growthbook Client Key',
    format: String,
    default: '',
    env: 'GROWTHBOOK_CLIENT_KEY',
  },
  growthbookApiHost: {
    doc: 'Origin serving the Growthbook proxy path. Defaults to APP_URL when empty.',
    format: String,
    default: '',
    env: 'GROWTHBOOK_API_HOST',
  },
}

export const growthbookConfig = isTest
  ? convict(growthbookSchema).getProperties()
  : convict(growthbookSchema).validate({ allowed: 'strict' }).getProperties()
