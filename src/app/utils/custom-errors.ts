export class ConflictError extends Error {
  /**
   * Custom name of this sub-class of Error
   */
  #name: string

  constructor(message: string) {
    super(message)
    this.#name = 'ConflictError'
  }
}

export class WebhookValidationError extends Error {
  /**
   * Custom name of this sub-class of Error
   */
  #name: string

  constructor(message: string) {
    super(message)
    this.#name = 'WebhookValidationError'
  }
}
