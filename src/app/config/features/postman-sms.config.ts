import convict, { Schema } from 'convict'

export interface ISms {
  mopCampaignId: string
  mopCampaignApiKey: string
  postmanBaseUrl: string
}

const postmanSmsSchema: Schema<ISms> = {
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
