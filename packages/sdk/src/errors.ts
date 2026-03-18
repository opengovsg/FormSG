class MissingSecretKeyError extends Error {
  constructor(
    message = 'Provide a secret key when initializing the FormSG SDK to use this function.'
  ) {
    super(message)
    this.name = this.constructor.name

    // Set the prototype explicitly.
    // See https://github.com/facebook/jest/issues/8279
    Object.setPrototypeOf(this, MissingSecretKeyError.prototype)
  }
}
class MissingPublicKeyError extends Error {
  constructor(
    message = 'Provide a public key when initializing the FormSG SDK to use this function.'
  ) {
    super(message)
    this.name = this.constructor.name

    // Set the prototype explicitly.
    // See https://github.com/facebook/jest/issues/8279
    Object.setPrototypeOf(this, MissingPublicKeyError.prototype)
  }
}

class WebhookAuthenticateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    // Set the prototype explicitly.
    // See https://github.com/facebook/jest/issues/8279
    Object.setPrototypeOf(this, WebhookAuthenticateError.prototype)
  }
}

class AttachmentDecryptionError extends Error {
  constructor(message = 'Attachment decryption with the given nonce failed.') {
    super(message)
    this.name = this.constructor.name
  }
}

export {
  MissingSecretKeyError,
  MissingPublicKeyError,
  WebhookAuthenticateError,
  AttachmentDecryptionError,
}
