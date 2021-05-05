import { ApplicationError } from '../core/core.errors'

export class ResultsNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
