import convict, { Schema } from 'convict'

export interface ScheduledClosureCron {
  apiSecret: string
}

const cronScheduledClosureFeature: Schema<ScheduledClosureCron> = {
  apiSecret: {
    doc: 'Scheduled form closure cron API secret key, used by the sweep cronjob to call protected routes',
    format: String,
    default: '',
    env: 'CRON_SCHEDULED_CLOSURE_API_SECRET',
  },
}

export const cronScheduledClosureConfig = convict(cronScheduledClosureFeature)
  .validate({ allowed: 'strict' })
  .getProperties()
