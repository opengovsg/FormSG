import { ApplicationError } from '../core/core.errors'

export class AgencyNotFoundError extends ApplicationError {
  constructor(message = 'Agency not found') {
    super(message)
  }
}
