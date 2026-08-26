import axios from 'axios'

import { changelogDigestConfig } from 'src/app/config/features/changelog-digest.config'

import { ChangelogSourceFetchError } from '../changelog.errors'
import { getMergedPullRequests } from '../changelog.sources'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/config/features/changelog-digest.config', () => ({
  changelogDigestConfig: {
    githubToken: 'test-token',
    githubRepo: 'opengovsg/FormSG',
    anthropicApiKey: 'test-key',
    slackWebhookUrl: '',
    previewRecipient: 'preview@example.com',
    apiSecret: 'test-secret',
  },
}))

const WINDOW = { since: '2026-08-01', until: '2026-08-15' }

const searchResponse = (items: unknown[], totalCount?: number) => ({
  data: { total_count: totalCount ?? items.length, items },
})

describe('getMergedPullRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    changelogDigestConfig.githubToken = 'test-token'
  })

  it('should error when no token is configured', async () => {
    changelogDigestConfig.githubToken = ''

    const actual = await getMergedPullRequests(WINDOW)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogSourceFetchError)
    expect(MockAxios.get).not.toHaveBeenCalled()
  })

  it('should query for merged pull requests within the window', async () => {
    MockAxios.get.mockResolvedValueOnce(searchResponse([]))

    await getMergedPullRequests(WINDOW)

    const { params } = MockAxios.get.mock.calls[0][1] as {
      params: { q: string }
    }
    expect(params.q).toContain('repo:opengovsg/FormSG')
    expect(params.q).toContain('is:merged')
    expect(params.q).toContain('base:develop')
    expect(params.q).toContain('merged:2026-08-01..2026-08-15')
  })

  it('should flatten labels onto each pull request', async () => {
    MockAxios.get.mockResolvedValueOnce(
      searchResponse([
        {
          number: 9833,
          title: 'feat(save-draft): enable save draft by default',
          body: 'Some description',
          labels: [{ name: 'feature' }, { name: 'changelog' }],
        },
      ]),
    )

    const actual = await getMergedPullRequests(WINDOW)

    expect(actual._unsafeUnwrap()).toEqual([
      {
        number: 9833,
        title: 'feat(save-draft): enable save draft by default',
        body: 'Some description',
        labels: ['feature', 'changelog'],
      },
    ])
  })

  it('should error when the request fails', async () => {
    MockAxios.get.mockRejectedValueOnce(new Error('network'))

    const actual = await getMergedPullRequests(WINDOW)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogSourceFetchError)
  })
})
