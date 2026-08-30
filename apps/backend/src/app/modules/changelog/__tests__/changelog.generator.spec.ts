import axios from 'axios'

import { changelogDigestConfig } from 'src/app/config/features/changelog-digest.config'

import { ChangelogGenerationError } from '../changelog.errors'
import {
  generateDigestItems,
  MAX_DIGEST_CANDIDATES,
} from '../changelog.generator'
import { MergedPullRequest } from '../changelog.types'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/config/features/changelog-digest.config', () => ({
  changelogDigestConfig: {
    anthropicApiKey: 'test-key',
    githubToken: 'test-token',
    githubRepo: 'opengovsg/FormSG',
    slackWebhookUrl: '',
    previewRecipient: 'preview@example.com',
    apiSecret: 'test-secret',
  },
}))

const PULL_REQUESTS: MergedPullRequest[] = [
  { number: 1, title: 'feat: save draft', body: null, labels: [] },
]

const itemsResponse = (items: unknown[]) => ({
  data: {
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify({ items }) }],
  },
})

const buildItem = (n: number) => ({
  title: `Item ${n}`,
  body: `Body ${n}`,
  sourcePullRequests: [n],
})

describe('generateDigestItems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    changelogDigestConfig.anthropicApiKey = 'test-key'
  })

  it('should return no items without calling the API when nothing merged', async () => {
    const actual = await generateDigestItems([])

    expect(actual._unsafeUnwrap()).toEqual([])
    expect(MockAxios.post).not.toHaveBeenCalled()
  })

  it('should error when the API key is not configured', async () => {
    changelogDigestConfig.anthropicApiKey = ''

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogGenerationError)
    expect(MockAxios.post).not.toHaveBeenCalled()
  })

  it('should return the drafted items', async () => {
    MockAxios.post.mockResolvedValueOnce(itemsResponse([buildItem(1)]))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap()).toEqual([buildItem(1)])
  })

  // A quiet cycle is the common case, not a failure. The prompt permits an
  // empty list and the caller must handle it as a success.
  it('should treat an empty list as success', async () => {
    MockAxios.post.mockResolvedValueOnce(itemsResponse([]))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap()).toEqual([])
  })

  // Structured output schemas cannot express a maximum array length, so the
  // ceiling has to hold even when the model ignores the instruction. This is a
  // runaway guard, not the digest size — how many items are sent is the
  // service's decision.
  it('should truncate to the ceiling when more candidates come back', async () => {
    const tooMany = Array.from({ length: MAX_DIGEST_CANDIDATES + 2 }, (_, i) =>
      buildItem(i),
    )
    MockAxios.post.mockResolvedValueOnce(itemsResponse(tooMany))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap()).toHaveLength(MAX_DIGEST_CANDIDATES)
  })

  // Ranking is the contract the service relies on when it takes the top three.
  it('should preserve the order the model returned', async () => {
    const ranked = [buildItem(0), buildItem(1), buildItem(2)]
    MockAxios.post.mockResolvedValueOnce(itemsResponse(ranked))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap().map((item) => item.title)).toEqual(
      ranked.map((item) => item.title),
    )
  })

  it('should error when the model declines the request', async () => {
    MockAxios.post.mockResolvedValueOnce({
      data: { stop_reason: 'refusal', content: [] },
    })

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogGenerationError)
  })

  it('should error when the response is not valid JSON', async () => {
    MockAxios.post.mockResolvedValueOnce({
      data: {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'not json' }],
      },
    })

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogGenerationError)
  })

  it('should error when the request fails', async () => {
    MockAxios.post.mockRejectedValueOnce(new Error('network'))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogGenerationError)
  })
})
