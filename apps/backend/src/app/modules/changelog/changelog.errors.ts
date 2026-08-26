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
