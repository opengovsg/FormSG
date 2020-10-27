import { ApplicationError } from '../core/core.errors'

export class FormNotFoundError extends ApplicationError {
  constructor(message = 'Form not found') {
    super(message)
  }
}
