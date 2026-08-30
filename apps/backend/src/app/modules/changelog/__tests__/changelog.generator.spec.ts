import { errAsync, okAsync } from 'neverthrow'

import { ModelResponseFailureError } from 'src/app/modules/form/admin-form/admin-form.errors'
import * as AiModel from 'src/app/modules/form/admin-form/ai-model'

import { ChangelogGenerationError } from '../changelog.errors'
import {
  generateDigestItems,
  MAX_DIGEST_CANDIDATES,
} from '../changelog.generator'
import { MergedPullRequest } from '../changelog.types'

jest.mock('src/app/modules/form/admin-form/ai-model')
const MockAiModel = jest.mocked(AiModel)

const PULL_REQUESTS: MergedPullRequest[] = [
  { number: 1, title: 'feat: save draft', body: null, labels: [] },
]

/** What the model returns: a JSON string, per the response format asked for. */
const itemsResponse = (items: unknown[]) =>
  okAsync(JSON.stringify({ items })) as ReturnType<
    typeof AiModel.sendPromptToModel
  >

const buildItem = (n: number) => ({
  title: `Item ${n}`,
  body: `Body ${n}`,
  sourcePullRequests: [n],
})

describe('generateDigestItems', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return no items without calling the model when nothing merged', async () => {
    const actual = await generateDigestItems([])

    expect(actual._unsafeUnwrap()).toEqual([])
    expect(MockAiModel.sendPromptToModel).not.toHaveBeenCalled()
  })

  it('should return the drafted items', async () => {
    MockAiModel.sendPromptToModel.mockReturnValue(itemsResponse([buildItem(1)]))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap()).toEqual([buildItem(1)])
  })

  // A quiet cycle is the common case, not a failure. The prompt permits an
  // empty list and the caller must handle it as a success.
  it('should treat an empty list as success', async () => {
    MockAiModel.sendPromptToModel.mockReturnValue(itemsResponse([]))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap()).toEqual([])
  })

  // The response format guarantees JSON, not this JSON, so the ceiling has to
  // hold even when the model ignores the instruction. This is a runaway guard,
  // not the digest size — how many items are sent is the service's decision.
  it('should truncate to the ceiling when more candidates come back', async () => {
    const tooMany = Array.from({ length: MAX_DIGEST_CANDIDATES + 2 }, (_, i) =>
      buildItem(i),
    )
    MockAiModel.sendPromptToModel.mockReturnValue(itemsResponse(tooMany))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap()).toHaveLength(MAX_DIGEST_CANDIDATES)
  })

  // Ranking is the contract the service relies on when it takes the top three.
  it('should preserve the order the model returned', async () => {
    const ranked = [buildItem(0), buildItem(1), buildItem(2)]
    MockAiModel.sendPromptToModel.mockReturnValue(itemsResponse(ranked))

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap().map((item) => item.title)).toEqual(
      ranked.map((item) => item.title),
    )
  })

  it('should error when the model request fails', async () => {
    MockAiModel.sendPromptToModel.mockReturnValue(
      errAsync(new ModelResponseFailureError()) as ReturnType<
        typeof AiModel.sendPromptToModel
      >,
    )

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogGenerationError)
  })

  // The shared client returns null when the response carried no content.
  it('should error when the model returns nothing', async () => {
    MockAiModel.sendPromptToModel.mockReturnValue(
      okAsync(null) as ReturnType<typeof AiModel.sendPromptToModel>,
    )

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogGenerationError)
  })

  it('should error when the response is not valid JSON', async () => {
    MockAiModel.sendPromptToModel.mockReturnValue(
      okAsync('not json at all') as ReturnType<
        typeof AiModel.sendPromptToModel
      >,
    )

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ChangelogGenerationError)
  })

  // json_object mode guarantees parseable JSON, not a shape. Valid JSON with no
  // items array must read as "nothing to report", not crash the cycle.
  it('should treat valid JSON without an items array as no items', async () => {
    MockAiModel.sendPromptToModel.mockReturnValue(
      okAsync('{"something":"else"}') as ReturnType<
        typeof AiModel.sendPromptToModel
      >,
    )

    const actual = await generateDigestItems(PULL_REQUESTS)

    expect(actual._unsafeUnwrap()).toEqual([])
  })
})
