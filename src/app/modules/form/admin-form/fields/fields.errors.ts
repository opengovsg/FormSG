import { ApplicationError } from '../../../core/core.errors'

export class EditFieldError extends ApplicationError {
  constructor(message: string) {
    super(message)
  }
}
