import { errAsync, okAsync } from 'neverthrow'

import { changelogDigestConfig } from 'src/app/config/features/changelog-digest.config'
import MailService from 'src/app/services/mail/mail.service'

import {
  ChangelogNotConfiguredError,
  ChangelogSourceFetchError,
} from '../changelog.errors'
import * as ChangelogGenerator from '../changelog.generator'
import {
  DIGEST_CTA_URL,
  DIGEST_ITEM_COUNT,
  generateAndPreviewDigest,
  nextDigestWindow,
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

const WINDOW = {
  since: '2026-08-01T00:00:00.000Z',
  until: '2026-08-15T00:00:00.000Z',
}

const PULL_REQUESTS: MergedPullRequest[] = [
  { number: 1, title: 'feat: save draft', body: null, labels: [] },
]

const ITEM: DigestItem = {
  title: 'Save your progress and finish later',
  body: 'Drafts are saved automatically as you work.',
  sourcePullRequests: [1],
}

/** A ranked run of candidates, most notable first. */
const items = (count: number): DigestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    title: `Item ${i}`,
    body: `Body ${i}`,
    sourcePullRequests: [i],
  }))

const mockLastSent = jest.fn()
jest.mock('src/app/models/changelog_digest.server.model', () => () => ({
  getLastSent: (...args: unknown[]) => mockLastSent(...args),
  create: jest.fn().mockResolvedValue({}),
}))

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

  it('should email the preview recipient and notify Slack when there are enough items', async () => {
    const candidates = items(DIGEST_ITEM_COUNT)
    MockGenerator.generateDigestItems.mockReturnValue(okAsync(candidates))

    const actual = await generateAndPreviewDigest(WINDOW)

    expect(actual._unsafeUnwrap()).toMatchObject({
      outcome: 'sent',
      sentItems: candidates,
      candidateCount: DIGEST_ITEM_COUNT,
    })
    expect(MockMailService.sendChangelogDigest).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'preview@example.com',
        ctaUrl: DIGEST_CTA_URL,
      }),
    )
    expect(MockSlack.notifySlack).toHaveBeenCalled()
  })

  // The whole point of holding items over: two quiet weeks are meant to produce
  // one good digest, not two thin ones. The generator ranks, the service cuts.
  it('should send only the best items when more than enough are found', async () => {
    const candidates = items(DIGEST_ITEM_COUNT + 2)
    MockGenerator.generateDigestItems.mockReturnValue(okAsync(candidates))

    const actual = await generateAndPreviewDigest(WINDOW)

    expect(actual._unsafeUnwrap()).toMatchObject({
      outcome: 'sent',
      candidateCount: DIGEST_ITEM_COUNT + 2,
    })
    expect(actual._unsafeUnwrap().sentItems).toEqual(
      candidates.slice(0, DIGEST_ITEM_COUNT),
    )
    expect(
      MockMailService.sendChangelogDigest.mock.calls[0][0].items,
    ).toHaveLength(DIGEST_ITEM_COUNT)
  })

  // Below the bar, nothing is sent and nothing is recorded, so the same changes
  // are reconsidered next cycle alongside whatever is new.
  it.each([0, 1, DIGEST_ITEM_COUNT - 1])(
    'should hold over and send no mail when only %i items are found',
    async (count) => {
      MockGenerator.generateDigestItems.mockReturnValue(okAsync(items(count)))

      const actual = await generateAndPreviewDigest(WINDOW)

      expect(actual._unsafeUnwrap()).toMatchObject({
        outcome: 'skipped',
        sentItems: [],
        candidateCount: count,
      })
      expect(MockMailService.sendChangelogDigest).not.toHaveBeenCalled()
      expect(MockSlack.notifySlack).toHaveBeenCalled()
    },
  )

  // Provenance is for the reviewer in Slack, never for the reader. The mail
  // payload must carry only what the template can render.
  it('should not pass pull request numbers to the email', async () => {
    MockGenerator.generateDigestItems.mockReturnValue(
      okAsync([ITEM, ...items(DIGEST_ITEM_COUNT - 1)]),
    )

    await generateAndPreviewDigest(WINDOW)

    const mailArgs = MockMailService.sendChangelogDigest.mock.calls[0][0]
    expect(mailArgs.items[0]).toEqual({ title: ITEM.title, body: ITEM.body })
    mailArgs.items.forEach((item) =>
      expect(item).not.toHaveProperty('sourcePullRequests'),
    )
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

/**
 * The watermark is what makes holding items over work: a cycle covers
 * everything since the last digest was *sent*, not since the job last ran.
 */
describe('nextDigestWindow', () => {
  beforeEach(() => jest.clearAllMocks())

  // The previous window's `until` becomes this one's `since` unchanged. Since
  // `since` is exclusive and `until` inclusive, the two windows abut exactly:
  // nothing between cycles is missed, and nothing is seen twice.
  it('should start exactly where the last sent digest ended', async () => {
    mockLastSent.mockResolvedValue({
      window: {
        since: '2026-08-01T00:00:00.000Z',
        until: '2026-08-17T01:00:00.000Z',
      },
    })

    const actual = await nextDigestWindow(new Date('2026-08-24T01:00:00.000Z'))

    expect(actual._unsafeUnwrap()).toEqual({
      since: '2026-08-17T01:00:00.000Z',
      until: '2026-08-24T01:00:00.000Z',
    })
  })

  it('should look back a week when nothing has ever been sent', async () => {
    mockLastSent.mockResolvedValue(null)

    const actual = await nextDigestWindow(new Date('2026-08-24T01:00:00.000Z'))

    expect(actual._unsafeUnwrap()).toEqual({
      since: '2026-08-17T01:00:00.000Z',
      until: '2026-08-24T01:00:00.000Z',
    })
  })

  // A skipped cycle records nothing, so the window keeps growing until a digest
  // actually goes out. This is what lets two quiet weeks combine.
  it('should span both weeks when the previous cycle was skipped', async () => {
    mockLastSent.mockResolvedValue({
      window: {
        since: '2026-08-03T01:00:00.000Z',
        until: '2026-08-10T01:00:00.000Z',
      },
    })

    const actual = await nextDigestWindow(new Date('2026-08-24T01:00:00.000Z'))

    expect(actual._unsafeUnwrap()).toEqual({
      since: '2026-08-10T01:00:00.000Z',
      until: '2026-08-24T01:00:00.000Z',
    })
  })

  it('should cross a month boundary correctly', async () => {
    mockLastSent.mockResolvedValue(null)

    const actual = await nextDigestWindow(new Date('2026-03-05T01:00:00.000Z'))

    expect(actual._unsafeUnwrap()).toEqual({
      since: '2026-02-26T01:00:00.000Z',
      until: '2026-03-05T01:00:00.000Z',
    })
  })
})
