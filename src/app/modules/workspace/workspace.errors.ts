import { ApplicationError } from '../core/core.errors'

export class WorkspaceNotFoundError extends ApplicationError {
  constructor(message = 'Workspace not found for the given user') {
    super(message)
  }
}
