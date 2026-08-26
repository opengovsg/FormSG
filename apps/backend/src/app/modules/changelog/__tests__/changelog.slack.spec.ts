import axios from 'axios'

import { changelogDigestConfig } from 'src/app/config/features/changelog-digest.config'

import { ChangelogNotificationError } from '../changelog.errors'
import { notifySlack } from '../changelog.slack'
import { DigestDraft } from '../changelog.types'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/config/features/changelog-digest.config', () => ({
  changelogDigestConfig: {
    slackWebhookUrl: 'https://hooks.slack.test/x',
    previewRecipient: 'preview@example.com',
    anthropicApiKey: 'test-key',
    githubToken: 'test-token',
    githubRepo: 'opengovsg/FormSG',
    apiSecret: 'test-secret',
  },
}))

const DRAFT: DigestDraft = {
  window: { since: '2026-08-01', until: '2026-08-15' },
  consideredPullRequests: 12,
  items: [
    {
      title: 'Save your progress and finish later',
      body: 'Drafts are saved automatically as you work.',
      sourcePullRequests: [9833],
    },
  ],
}

const postedBody = () => MockAxios.post.mock.calls[0][1] as { text: string }

describe('notifySlack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    changelogDigestConfig.slackWebhookUrl = 'https://hooks.slack.test/x'
    MockAxios.post.mockResolvedValue({ data: 'ok' })
  })

  // A local run should be useful without Slack configured, so this is a skip
  // rather than a failure.
  it('should skip without erroring when no webhook is configured', async () => {
    changelogDigestConfig.slackWebhookUrl = ''

    const actual = await notifySlack(DRAFT, 'preview@example.com')

    expect(actual._unsafeUnwrap()).toBe(false)
    expect(MockAxios.post).not.toHaveBeenCalled()
  })

  it('should post the draft to the webhook', async () => {
    const actual = await notifySlack(DRAFT, 'preview@example.com')

    expect(actual._unsafeUnwrap()).toBe(true)
    expect(MockAxios.post).toHaveBeenCalledWith(
      'https://hooks.slack.test/x',
      expect.objectContaining({ text: expect.stringContaining('1 item') }),
    )
  })

  // Slack is where a reviewer checks a claim against the change behind it, so
  // provenance belongs here even though it never reaches the email.
  it('should include source pull request numbers', async () => {
    await notifySlack(DRAFT, 'preview@example.com')

    expect(JSON.stringify(postedBody())).toContain('#9833')
  })

  it('should say when there is nothing to announce', async () => {
    await notifySlack({ ...DRAFT, items: [] }, 'preview@example.com')

    expect(postedBody().text).toBe('Nothing to announce this cycle')
  })

  it('should error when the webhook call fails', async () => {
    MockAxios.post.mockRejectedValueOnce(new Error('network'))

    const actual = await notifySlack(DRAFT, 'preview@example.com')

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogNotificationError)
  })
})
