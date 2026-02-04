import convict from 'convict'

const isDev = process.env.NODE_ENV === 'development'

const isTest = process.env.NODE_ENV === 'test'

export const config = convict({
  environment: {
    env: 'NODE_ENV',
    format: [
      'development',
      'stg',
      'stg-alt',
      'stg-alt2',
      'stg-alt3',
      'uat',
      'production',
      'test',
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
  guarddutyScanCheckTimeout: {
    env: 'GUARDDUTY_SCAN_AWAIT_TIMEOUT',
    format: Number,
    description:
      'Total amount of time to repeatedly check if GuardDuty has scanned and tagged the file before timing out and marking as failure.',
    default: 40 * 1000, // 40 seconds.
  },
  guarddutyScanCheckDelay: {
    env: 'GUARDDUTY_SCAN_CHECK_DELAY',
    format: Number,
    description:
      'Initial amount of time to wait before retrying checking if Guardduty has scanned and tagged the file.',
    default: 200, // 0.2 seconds.
  },
  guarddutyScanCheckMaxBackoff: {
    env: 'GUARDDUTY_SCAN_CHECK_MAX_BACKOFF',
    format: Number,
    description:
      'Maximum amount of time for backoff to for retries for checking if Guardduty has scanned and tagged the file.',
    default: 2 * 1000, // 2 seconds.
  },
})
  .validate()
  .getProperties()
