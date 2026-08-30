import axios from 'axios'
import { errAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'

import { ChangelogSourceFetchError } from './changelog.errors'
import { DigestWindow, MergedPullRequest } from './changelog.types'

const logger = createLoggerWithLabel(module)

const GITHUB_SEARCH_URL = 'https://api.github.com/search/issues'

/**
 * GitHub caps search results at 100 per page. A week of merges sits well under
 * that. A window large enough to exceed it means either the caller passed the
 * wrong dates or the digest has been holding items over for a very long time —
 * both worth noticing rather than quietly paginating through.
 */
const PER_PAGE = 100

type GithubSearchResponse = {
  total_count: number
  items: {
    number: number
    title: string
    body: string | null
    labels: { name: string }[]
  }[]
}

/**
 * Fetches pull requests merged into `develop` within the window.
 *
 * Note this returns everything merged, not everything worth announcing. Most of
 * what lands is invisible to a form admin: translation groundwork, library
 * upgrades, monitoring, dead code removal, version bumps. Filtering that down
 * is the generator's job, not this one's.
 */
export const getMergedPullRequests = (
  window: DigestWindow,
): ResultAsync<MergedPullRequest[], ChangelogSourceFetchError> => {
  const { githubToken, githubRepo } = changelogDigestConfig

  if (!githubToken) {
    return errAsync(
      new ChangelogSourceFetchError('CHANGELOG_GITHUB_TOKEN is not set'),
    )
  }

  const query = [
    `repo:${githubRepo}`,
    'is:pr',
    'is:merged',
    'base:develop',
    // Exclusive lower bound, inclusive upper. GitHub's `a..b` range is
    // inclusive at both ends, which would hand the generator every pull request
    // merged at the previous window's boundary a second time — and a repeated
    // item in consecutive digests is the most visible way this could embarrass
    // us. Two qualifiers instead; GitHub ANDs them.
    `merged:>${window.since}`,
    `merged:<=${window.until}`,
  ].join(' ')

  return ResultAsync.fromPromise(
    axios.get<GithubSearchResponse>(GITHUB_SEARCH_URL, {
      params: { q: query, per_page: PER_PAGE },
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
    (error) => {
      logger.error({
        message: 'Failed to fetch merged pull requests',
        meta: { action: 'getMergedPullRequests', window, githubRepo },
        error,
      })
      return new ChangelogSourceFetchError()
    },
  ).map(({ data }) => {
    if (data.total_count > data.items.length) {
      logger.warn({
        message:
          'More merged pull requests than the page size; window is probably too wide',
        meta: {
          action: 'getMergedPullRequests',
          window,
          totalCount: data.total_count,
          returned: data.items.length,
        },
      })
    }

    return data.items.map((item) => ({
      number: item.number,
      title: item.title,
      body: item.body,
      labels: item.labels.map((label) => label.name),
    }))
  })
}
