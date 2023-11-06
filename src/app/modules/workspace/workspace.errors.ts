import { ApplicationError } from '../core/core.errors'

export class WorkspaceNotFoundError extends ApplicationError {
  constructor(message = 'Workspace not found for the given user') {
    super(message)
  }
}

export class ForbiddenWorkspaceError extends ApplicationError {
  constructor(
    message = "You don't have permissions to delete or update this workspace",
  ) {
    super(message)
  }
}
