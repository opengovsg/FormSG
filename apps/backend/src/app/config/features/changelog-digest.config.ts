import convict, { Schema } from 'convict'

export interface IChangelogDigest {
  apiSecret: string
  anthropicApiKey: string
  githubToken: string
  githubRepo: string
  slackWebhookUrl: string
  previewRecipient: string
}

const changelogDigestFeature: Schema<IChangelogDigest> = {
  apiSecret: {
    doc: 'Shared secret used by the scheduler to call the digest generation route',
    format: String,
    default: '',
    env: 'CRON_CHANGELOG_API_SECRET',
    sensitive: true,
  },
  anthropicApiKey: {
    doc: 'Anthropic API key used to draft digest items from merged pull requests',
    format: String,
    default: '',
    env: 'ANTHROPIC_API_KEY',
    sensitive: true,
  },
  githubToken: {
    doc: 'GitHub token with read access to pull requests on the FormSG repository',
    format: String,
    default: '',
    env: 'CHANGELOG_GITHUB_TOKEN',
    sensitive: true,
  },
  githubRepo: {
    doc: 'Repository to read merged pull requests from, as owner/name',
    format: String,
    default: 'opengovsg/FormSG',
    env: 'CHANGELOG_GITHUB_REPO',
  },
  slackWebhookUrl: {
    doc: 'Slack incoming webhook that receives the drafted digest for review',
    format: String,
    default: '',
    env: 'CHANGELOG_SLACK_WEBHOOK_URL',
    sensitive: true,
  },
  previewRecipient: {
    doc: 'The single address every generated digest is sent to. There is deliberately no path to the real admin list until an approval flow exists.',
    format: String,
    default: '',
    env: 'CHANGELOG_PREVIEW_RECIPIENT',
  },
}

export const changelogDigestConfig = convict(changelogDigestFeature)
  .validate({ allowed: 'strict' })
  .getProperties()
