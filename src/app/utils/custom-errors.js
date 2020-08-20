class ConflictError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConflictError'
  }
}

class WebhookValidationError extends Error {
  constructor(msg) {
    super(msg)
    this.name = 'WebhookValidationError'
  }
}

module.exports = {
  ConflictError,
  WebhookValidationError,
}
