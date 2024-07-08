import convict, { Schema } from 'convict'

export interface IPostmanSms {
  // MOP SMSes are to be sent using GovSG sender id
  mopCampaignId: string
  mopCampaignApiKey: string
  // Internal SMSes are to be sent using FormSG sender id
  internalCampaignId: string
  internalCampaignApiKey: string
  postmanBaseUrl: string
}

const postmanSmsSchema: Schema<IPostmanSms> = {
  mopCampaignId: {
    doc: 'Postman SMS messaging campaign ID',
    format: String,
    default: null,
    env: 'POSTMAN_MOP_CAMPAIGN_ID',
  },
  mopCampaignApiKey: {
    doc: 'Postman SMS messaging campaign ID',
    format: String,
    default: null,
    env: 'POSTMAN_MOP_CAMPAIGN_API_KEY',
  },
  internalCampaignId: {
    doc: 'Postman SMS messaging internal (non-mop) campaign ID',
    format: String,
    default: null,
    env: 'POSTMAN_INTERNAL_CAMPAIGN_ID',
  },
  internalCampaignApiKey: {
    doc: 'Postman SMS messaging internal (non-mop) campaign ID',
    format: String,
    default: null,
    env: 'POSTMAN_INTERNAL_CAMPAIGN_API_KEY',
  },
  postmanBaseUrl: {
    doc: 'Postman base URL',
    format: String,
    default: null,
    env: 'POSTMAN_BASE_URL',
  },
}

export const postmanSmsConfig = convict(postmanSmsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
