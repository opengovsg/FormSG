import { ChangelogDigestItem } from '../../views/templates/ChangelogDigestEmail'

/** A pull request merged into the default branch during the digest window. */
export type MergedPullRequest = {
  number: number
  title: string
  body: string | null
  labels: string[]
}

/**
 * An item as it will appear in the email, plus the pull requests it was drawn
 * from. The provenance never reaches the reader; it exists so a reviewer can
 * check a claim against the change that produced it instead of judging whether
 * it sounds plausible.
 */
export type DigestItem = ChangelogDigestItem & {
  sourcePullRequests: number[]
}

export type DigestWindow = {
  /** Inclusive ISO date, YYYY-MM-DD. */
  since: string
  /** Inclusive ISO date, YYYY-MM-DD. */
  until: string
}

export type DigestDraft = {
  items: DigestItem[]
  window: DigestWindow
  /** How many merged pull requests the generator was given. */
  consideredPullRequests: number
}

/**
 * What one cycle did.
 *
 * `skipped` is the ordinary outcome, not a failure: a week that produced fewer
 * than the required number of notable changes sends nothing and leaves the
 * watermark where it was, so the next cycle reconsiders those changes together
 * with whatever has since merged.
 */
export type DigestCycleResult = {
  outcome: 'sent' | 'skipped'
  draft: DigestDraft
  /** Items actually emailed. Empty when the cycle was skipped. */
  sentItems: DigestItem[]
  /** How many notable items the generator found, before the top-N cut. */
  candidateCount: number
}
