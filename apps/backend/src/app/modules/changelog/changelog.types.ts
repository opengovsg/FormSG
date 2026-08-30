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

/**
 * The span a cycle covers, as ISO 8601 instants rather than dates.
 *
 * Exclusive at `since`, inclusive at `until`. That asymmetry is what lets one
 * window's `until` become the next one's `since` with neither a gap nor an
 * overlap: a pull request merged at exactly the boundary belongs to the earlier
 * window only, and so is reported once.
 *
 * Instants rather than dates because a date cannot express the boundary. A
 * digest sent at 09:00 on the 17th has to exclude what it already reported that
 * morning while still picking up what merges that afternoon, and "the 17th" is
 * either all of both or neither.
 */
export type DigestWindow = {
  /** Exclusive lower bound, ISO 8601 instant. */
  since: string
  /** Inclusive upper bound, ISO 8601 instant. */
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
