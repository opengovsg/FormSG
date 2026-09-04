import axios from 'axios'
import { errAsync, ResultAsync } from 'neverthrow'

import { changelogDigestConfig } from '../../config/features/changelog-digest.config'
import { createLoggerWithLabel } from '../../config/logger'

import { ChangelogSourceFetchError } from './changelog.errors'
import { DigestWindow, MergedPullRequest } from './changelog.types'

const logger = createLoggerWithLabel(module)

const GITHUB_SEARCH_URL = 'https://api.github.com/search/issues'

/**
 * The instant just after `since`, so an inclusive range expresses an exclusive
 * lower bound. See the query below for why the range has to be inclusive.
 */
const exclusiveLowerBound = (since: string): string =>
  new Date(new Date(since).getTime() + 1).toISOString()

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
    // One range qualifier, not two. GitHub applies only the *last* `merged:`
    // qualifier in a query and silently drops the rest — no error, just a
    // result set that quietly ignores the window. `merged:>a merged:<=b`
    // therefore means `merged:<=b`, which is every pull request the repository
    // has ever merged.
    //
    // The range is inclusive at both ends, and the window's `since` is
    // exclusive, so the bound is nudged forward by the smallest unit the
    // format carries. A millisecond is not a meaningful amount of time to
    // anyone reading a digest, but it is the difference between a pull request
    // merged exactly at a boundary appearing in one digest or in two.
    `merged:${exclusiveLowerBound(window.since)}..${window.until}`,
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
