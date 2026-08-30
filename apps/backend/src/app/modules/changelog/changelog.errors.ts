import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class ChangelogNotConfiguredError extends ApplicationError {
  constructor(message = 'Changelog digest is not configured') {
    super(message, undefined, ErrorCodes.CHANGELOG_NOT_CONFIGURED)
  }
}

export class ChangelogSourceFetchError extends ApplicationError {
  constructor(
    message = 'Failed to fetch merged pull requests',
    meta?: unknown,
  ) {
    super(message, meta, ErrorCodes.CHANGELOG_SOURCE_FETCH)
  }
}

export class ChangelogGenerationError extends ApplicationError {
  constructor(message = 'Failed to draft digest items', meta?: unknown) {
    super(message, meta, ErrorCodes.CHANGELOG_GENERATION)
  }
}

export class ChangelogNotificationError extends ApplicationError {
  constructor(message = 'Failed to notify Slack', meta?: unknown) {
    super(message, meta, ErrorCodes.CHANGELOG_NOTIFICATION)
  }
}

export class ChangelogDigestNotFoundError extends ApplicationError {
  constructor(message = 'No digest with that id', meta?: unknown) {
    super(message, meta, ErrorCodes.CHANGELOG_DIGEST_NOT_FOUND)
  }
}

/**
 * The digest exists but is not in a state that can be approved: it was already
 * sent, it was held for having too little to say, or a later cycle superseded
 * it. The message names which, because "cannot approve" on its own sends
 * someone reading a log to the database.
 */
export class ChangelogDigestNotApprovableError extends ApplicationError {
  constructor(message = 'Digest cannot be approved', meta?: unknown) {
    super(message, meta, ErrorCodes.CHANGELOG_DIGEST_NOT_APPROVABLE)
  }
}
