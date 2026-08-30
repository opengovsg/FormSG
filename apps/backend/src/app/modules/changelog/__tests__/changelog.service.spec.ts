import { errAsync, okAsync } from 'neverthrow'

import { changelogDigestConfig } from 'src/app/config/features/changelog-digest.config'
import MailService from 'src/app/services/mail/mail.service'

import {
  ChangelogDigestNotApprovableError,
  ChangelogDigestNotFoundError,
  ChangelogNotConfiguredError,
  ChangelogSourceFetchError,
} from '../changelog.errors'
import * as ChangelogGenerator from '../changelog.generator'
import {
  approveDigest,
  DIGEST_CTA_URL,
  DIGEST_ITEM_COUNT,
  generateDigest,
  isoWeek,
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

const mockGetLastSent = jest.fn()
const mockGetByWeek = jest.fn()
const mockSupersedeOpenDrafts = jest.fn()
const mockCreate = jest.fn()
const mockFindById = jest.fn()
const mockFindByIdAndUpdate = jest.fn()

jest.mock('src/app/models/changelog_digest.server.model', () => () => ({
  getLastSent: (...a: unknown[]) => mockGetLastSent(...a),
  getByWeek: (...a: unknown[]) => mockGetByWeek(...a),
  supersedeOpenDrafts: (...a: unknown[]) => mockSupersedeOpenDrafts(...a),
  create: (...a: unknown[]) => mockCreate(...a),
  findById: (...a: unknown[]) => ({ exec: () => mockFindById(...a) }),
  findByIdAndUpdate: (...a: unknown[]) => ({
    exec: () => mockFindByIdAndUpdate(...a),
  }),
}))

jest.mock('../changelog.sources')
jest.mock('../changelog.generator')
jest.mock('../changelog.slack')
jest.mock('src/app/services/mail/mail.service')

const MockSources = jest.mocked(ChangelogSources)
const MockGenerator = jest.mocked(ChangelogGenerator)
const MockSlack = jest.mocked(ChangelogSlack)
const MockMailService = jest.mocked(MailService)

const NOW = new Date('2026-08-24T01:00:00.000Z')

const PULL_REQUESTS: MergedPullRequest[] = [
  { number: 1, title: 'feat: save draft', body: null, labels: [] },
]

/** A ranked run of candidates, most notable first. */
const items = (count: number): DigestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    title: `Item ${i}`,
    body: `Body ${i}`,
    sourcePullRequests: [i],
  }))

const digestDoc = (overrides = {}) => ({
  _id: 'a'.repeat(24),
  week: '2026-W35',
  status: 'draft',
  window: {
    since: '2026-08-17T01:00:00.000Z',
    until: '2026-08-24T01:00:00.000Z',
  },
  items: items(DIGEST_ITEM_COUNT),
  recipients: [],
  ...overrides,
})

describe('isoWeek', () => {
  it.each([
    ['2026-08-24T00:00:00Z', '2026-W35'],
    ['2026-08-30T23:59:59Z', '2026-W35'],
    ['2026-08-31T00:00:00Z', '2026-W36'],
  ])('should place %s in %s', (iso, expected) => {
    expect(isoWeek(new Date(iso))).toEqual(expected)
  })

  // The first days of January frequently belong to the previous ISO year. Get
  // this wrong and one calendar week generates two digests.
  it('should attribute early January to the previous ISO year', () => {
    expect(isoWeek(new Date('2027-01-01T00:00:00Z'))).toEqual('2026-W53')
  })

  // Monday 24 August through Sunday 30 August 2026 is one ISO week. Every day
  // in it must key the same digest, or a second run midweek would draft again.
  it('should give the same week for every day from Monday to Sunday', () => {
    const monday = Date.UTC(2026, 7, 24)
    const week = new Array(7)
      .fill(0)
      .map((_, i) => isoWeek(new Date(monday + i * 86400000)))

    expect(new Set(week)).toEqual(new Set(['2026-W35']))
  })
})

describe('generateDigest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MockSources.getMergedPullRequests.mockReturnValue(okAsync(PULL_REQUESTS))
    MockSlack.notifySlack.mockReturnValue(okAsync(true))
    mockGetLastSent.mockResolvedValue(null)
    mockGetByWeek.mockResolvedValue(null)
    mockSupersedeOpenDrafts.mockResolvedValue(0)
    mockCreate.mockImplementation((doc) => Promise.resolve(digestDoc(doc)))
  })

  // The property that lets the schedule and a person share one endpoint.
  it('should do nothing when a digest already exists for the week', async () => {
    const existing = digestDoc({ status: 'sent' })
    mockGetByWeek.mockResolvedValue(existing)

    const actual = await generateDigest(NOW)

    expect(actual._unsafeUnwrap()).toBe(existing)
    expect(MockSources.getMergedPullRequests).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('should persist a draft when there are enough items', async () => {
    MockGenerator.generateDigestItems.mockReturnValue(
      okAsync(items(DIGEST_ITEM_COUNT)),
    )

    await generateDigest(NOW)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ week: '2026-W35', status: 'draft' }),
    )
  })

  // Without a row, "already generated this week" would be false and a re-run
  // would draft again. The items are not lost: the next window still reaches
  // back to the last *sent* digest.
  it.each([0, 1, DIGEST_ITEM_COUNT - 1])(
    'should persist a held digest when only %i items are found',
    async (count) => {
      MockGenerator.generateDigestItems.mockReturnValue(okAsync(items(count)))

      await generateDigest(NOW)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'held' }),
      )
      expect(mockSupersedeOpenDrafts).not.toHaveBeenCalled()
    },
  )

  it('should never send mail', async () => {
    MockGenerator.generateDigestItems.mockReturnValue(
      okAsync(items(DIGEST_ITEM_COUNT)),
    )

    await generateDigest(NOW)

    expect(MockMailService.sendChangelogDigest).not.toHaveBeenCalled()
  })

  // A new draft covers a strict superset of an older unapproved one, so
  // approving the old one would send a digest missing the latest week.
  it('should supersede older drafts that were never approved', async () => {
    MockGenerator.generateDigestItems.mockReturnValue(
      okAsync(items(DIGEST_ITEM_COUNT)),
    )
    mockSupersedeOpenDrafts.mockResolvedValue(1)

    await generateDigest(NOW)

    expect(mockSupersedeOpenDrafts).toHaveBeenCalled()
  })

  describe('the window it covers', () => {
    beforeEach(() =>
      MockGenerator.generateDigestItems.mockReturnValue(
        okAsync(items(DIGEST_ITEM_COUNT)),
      ),
    )

    it('should start exactly where the last sent digest ended', async () => {
      mockGetLastSent.mockResolvedValue(
        digestDoc({
          window: {
            since: '2026-08-01T00:00:00.000Z',
            until: '2026-08-17T01:00:00.000Z',
          },
        }),
      )

      await generateDigest(NOW)

      expect(MockSources.getMergedPullRequests).toHaveBeenCalledWith({
        since: '2026-08-17T01:00:00.000Z',
        until: '2026-08-24T01:00:00.000Z',
      })
    })

    it('should look back a week when nothing has ever been sent', async () => {
      mockGetLastSent.mockResolvedValue(null)

      await generateDigest(NOW)

      expect(MockSources.getMergedPullRequests).toHaveBeenCalledWith({
        since: '2026-08-17T01:00:00.000Z',
        until: '2026-08-24T01:00:00.000Z',
      })
    })
  })

  it('should propagate a source failure without persisting anything', async () => {
    MockSources.getMergedPullRequests.mockReturnValue(
      errAsync(new ChangelogSourceFetchError()),
    )

    const actual = await generateDigest(NOW)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogSourceFetchError)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('approveDigest', () => {
  const DIGEST_ID = 'a'.repeat(24)

  beforeEach(() => {
    jest.clearAllMocks()
    changelogDigestConfig.previewRecipient = 'preview@example.com'
    MockMailService.sendChangelogDigest.mockReturnValue(okAsync(true))
    mockFindById.mockResolvedValue(digestDoc())
    mockFindByIdAndUpdate.mockImplementation(() =>
      Promise.resolve(digestDoc({ status: 'sent' })),
    )
  })

  it('should refuse to run when no preview recipient is configured', async () => {
    changelogDigestConfig.previewRecipient = ''

    const actual = await approveDigest(DIGEST_ID)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(
      ChangelogNotConfiguredError,
    )
    expect(MockMailService.sendChangelogDigest).not.toHaveBeenCalled()
  })

  it('should email the single configured recipient and mark the digest sent', async () => {
    await approveDigest(DIGEST_ID)

    expect(MockMailService.sendChangelogDigest).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'preview@example.com',
        ctaUrl: DIGEST_CTA_URL,
      }),
    )
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      DIGEST_ID,
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'sent' }),
      }),
      { new: true },
    )
  })

  it('should email only the best items when more were drafted', async () => {
    mockFindById.mockResolvedValue(
      digestDoc({ items: items(DIGEST_ITEM_COUNT + 2) }),
    )

    await approveDigest(DIGEST_ID)

    const mailArgs = MockMailService.sendChangelogDigest.mock.calls[0][0]
    expect(mailArgs.items).toHaveLength(DIGEST_ITEM_COUNT)
    expect(mailArgs.items[0].title).toEqual('Item 0')
  })

  // Provenance is for the reviewer, never for the reader.
  it('should not pass pull request numbers to the email', async () => {
    await approveDigest(DIGEST_ID)

    const mailArgs = MockMailService.sendChangelogDigest.mock.calls[0][0]
    mailArgs.items.forEach((item) =>
      expect(item).not.toHaveProperty('sourcePullRequests'),
    )
  })

  it('should report a missing digest rather than sending anything', async () => {
    mockFindById.mockResolvedValue(null)

    const actual = await approveDigest(DIGEST_ID)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(
      ChangelogDigestNotFoundError,
    )
    expect(MockMailService.sendChangelogDigest).not.toHaveBeenCalled()
  })

  // Approving twice would mail the same digest again; approving a held or
  // superseded one would send something the pipeline decided not to send.
  it.each(['sent', 'held', 'superseded'])(
    'should refuse to approve a %s digest',
    async (status) => {
      mockFindById.mockResolvedValue(digestDoc({ status }))

      const actual = await approveDigest(DIGEST_ID)

      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(
        ChangelogDigestNotApprovableError,
      )
      expect(MockMailService.sendChangelogDigest).not.toHaveBeenCalled()
    },
  )
})
