import { errAsync, okAsync } from 'neverthrow'

import { changelogDigestConfig } from 'src/app/config/features/changelog-digest.config'
import MailService from 'src/app/services/mail/mail.service'

import {
  ChangelogNotConfiguredError,
  ChangelogSourceFetchError,
} from '../changelog.errors'
import * as ChangelogGenerator from '../changelog.generator'
import {
  defaultWindow,
  DIGEST_CTA_URL,
  generateAndPreviewDigest,
} from '../changelog.service'
import * as ChangelogSlack from '../changelog.slack'
import * as ChangelogSources from '../changelog.sources'
import { DigestItem, MergedPullRequest } from '../changelog.types'

jest.mock('src/app/config/features/changelog-digest.config', () => ({
  changelogDigestConfig: {
    anthropicApiKey: 'test-key',
    githubToken: 'test-token',
    githubRepo: 'opengovsg/FormSG',
    slackWebhookUrl: 'https://hooks.slack.test/x',
    previewRecipient: 'preview@example.com',
    apiSecret: 'test-secret',
  },
}))

jest.mock('../changelog.sources')
jest.mock('../changelog.generator')
jest.mock('../changelog.slack')
jest.mock('src/app/services/mail/mail.service')

const MockSources = jest.mocked(ChangelogSources)
const MockGenerator = jest.mocked(ChangelogGenerator)
const MockSlack = jest.mocked(ChangelogSlack)
const MockMailService = jest.mocked(MailService)

const WINDOW = { since: '2026-08-01', until: '2026-08-15' }

const PULL_REQUESTS: MergedPullRequest[] = [
  { number: 1, title: 'feat: save draft', body: null, labels: [] },
]

const ITEM: DigestItem = {
  title: 'Save your progress and finish later',
  body: 'Drafts are saved automatically as you work.',
  sourcePullRequests: [1],
}

describe('generateAndPreviewDigest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    changelogDigestConfig.previewRecipient = 'preview@example.com'
    MockSources.getMergedPullRequests.mockReturnValue(okAsync(PULL_REQUESTS))
    MockSlack.notifySlack.mockReturnValue(okAsync(true))
    MockMailService.sendChangelogDigest.mockReturnValue(okAsync(true))
  })

  it('should refuse to run when no preview recipient is configured', async () => {
    changelogDigestConfig.previewRecipient = ''

    const actual = await generateAndPreviewDigest(WINDOW)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(
      ChangelogNotConfiguredError,
    )
    expect(MockSources.getMergedPullRequests).not.toHaveBeenCalled()
  })

  it('should email the preview recipient and notify Slack when there are items', async () => {
    MockGenerator.generateDigestItems.mockReturnValue(okAsync([ITEM]))

    const actual = await generateAndPreviewDigest(WINDOW)

    expect(actual._unsafeUnwrap()).toEqual({
      items: [ITEM],
      window: WINDOW,
      consideredPullRequests: 1,
    })
    expect(MockMailService.sendChangelogDigest).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'preview@example.com',
        ctaUrl: DIGEST_CTA_URL,
      }),
    )
    expect(MockSlack.notifySlack).toHaveBeenCalled()
  })

  // Provenance is for the reviewer in Slack, never for the reader. The mail
  // payload must carry only what the template can render.
  it('should not pass pull request numbers to the email', async () => {
    MockGenerator.generateDigestItems.mockReturnValue(okAsync([ITEM]))

    await generateAndPreviewDigest(WINDOW)

    const mailArgs = MockMailService.sendChangelogDigest.mock.calls[0][0]
    expect(mailArgs.items).toEqual([{ title: ITEM.title, body: ITEM.body }])
  })

  // A quiet cycle is expected. Nothing should be emailed, but Slack still hears
  // about it so silence is not mistaken for a job that failed.
  it('should notify Slack but send no mail when there are no items', async () => {
    MockGenerator.generateDigestItems.mockReturnValue(okAsync([]))

    const actual = await generateAndPreviewDigest(WINDOW)

    expect(actual._unsafeUnwrap().items).toEqual([])
    expect(MockMailService.sendChangelogDigest).not.toHaveBeenCalled()
    expect(MockSlack.notifySlack).toHaveBeenCalled()
  })

  it('should propagate a source failure without sending anything', async () => {
    MockSources.getMergedPullRequests.mockReturnValue(
      errAsync(new ChangelogSourceFetchError()),
    )

    const actual = await generateAndPreviewDigest(WINDOW)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogSourceFetchError)
    expect(MockMailService.sendChangelogDigest).not.toHaveBeenCalled()
    expect(MockSlack.notifySlack).not.toHaveBeenCalled()
  })
})

describe('defaultWindow', () => {
  it('should span the preceding 14 days inclusive', () => {
    expect(defaultWindow(new Date('2026-08-27T00:00:00Z'))).toEqual({
      since: '2026-08-13',
      until: '2026-08-27',
    })
  })

  it('should cross a month boundary correctly', () => {
    expect(defaultWindow(new Date('2026-03-05T00:00:00Z'))).toEqual({
      since: '2026-02-19',
      until: '2026-03-05',
    })
  })
})
