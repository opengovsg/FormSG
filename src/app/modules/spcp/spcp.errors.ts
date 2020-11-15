import { ApplicationError } from '../../modules/core/core.errors'
/**
 * Error while creating redirect URL
 */
export class CreateRedirectUrlError extends ApplicationError {
  constructor(message?: string) {
    super(message ?? 'Error while creating redirect URL')
  }
}
