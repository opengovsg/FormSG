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

class AxiosError extends Error {
  constructor(msg, response) {
    super(msg)
    this.name = 'AxiosError'
    this.response = response
  }
}

module.exports = {
  ConflictError,
  WebhookValidationError,
  AxiosError,
}
