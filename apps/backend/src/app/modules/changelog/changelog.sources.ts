import axios from 'axios'
import { errAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'

import { ChangelogSourceFetchError } from './changelog.errors'
import { DigestWindow, MergedPullRequest } from './changelog.types'

const logger = createLoggerWithLabel(module)

const GITHUB_SEARCH_URL = 'https://api.github.com/search/issues'

/**
 * GitHub caps search results at 100 per page. A fortnight of merges sits well
 * under that, and a window large enough to exceed it is a signal that the
 * caller passed the wrong dates rather than something to paginate through.
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
    `merged:${window.since}..${window.until}`,
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
