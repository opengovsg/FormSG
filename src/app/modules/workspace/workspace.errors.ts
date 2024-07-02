import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class WorkspaceNotFoundError extends ApplicationError {
  constructor(message = 'Workspace not found for the given user') {
    super(message, undefined, ErrorCodes.WorkspaceNotFound)
  }
}

export class ForbiddenWorkspaceError extends ApplicationError {
  constructor(
    message = "You don't have permissions to delete or update this workspace",
  ) {
    super(message, undefined, ErrorCodes.ForbiddenWorkspace)
  }
}
