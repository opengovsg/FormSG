import convict from 'convict'

const isDev = process.env.NODE_ENV === 'development'

const isTest = process.env.NODE_ENV === 'test'

export const config = convict({
  environment: {
    env: 'NODE_ENV',
    format: [
      'development',
      'staging',
      'stg-alt3',
      'uat',
      'production',
      'test',
      'vapt',
    ],
    default: 'development',
  },
  isTestOrDev: {
    default: isDev || isTest,
  },
  virusScannerQuarantineS3Bucket: {
    env: 'GUARDDUTY_QUARANTINE_S3_BUCKET',
    format: String,
    default: '',
  },
  virusScannerCleanS3Bucket: {
    env: 'GUARDDUTY_CLEAN_S3_BUCKET',
    format: String,
    default: '',
  },
})
  .validate()
  .getProperties()
