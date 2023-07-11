import { ApplicationError } from '../../modules/core/core.errors'

/**
 * Error connecting to captcha server
 */
export class TurnstileConnectionError extends ApplicationError {
  constructor(message = 'Error while connecting to Turnstile server.') {
    super(message)
  }
}

/**
 * Wrong captcha response
 */
export class VerifyTurnstileError extends ApplicationError {
  constructor(message = 'Incorrect Turnstile response.') {
    super(message)
  }
}

/**
 * Missing captcha response
 */
export class MissingTurnstileError extends ApplicationError {
  constructor(message = 'Missing Turnstile response.') {
    super(message)
  }
}
