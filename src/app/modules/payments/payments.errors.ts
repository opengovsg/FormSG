import { ApplicationError } from '../core/core.errors'

export class InvalidPaymentAmountError extends ApplicationError {
  constructor(message = 'Invalid payment amount') {
    super(message)
  }
}

export class PaymentNotFoundError extends ApplicationError {
  constructor(message = 'Payment not found') {
    super(message)
  }
}

export class ConfirmedPaymentNotFoundError extends ApplicationError {
  constructor(message = 'Confirmed payment not found') {
    super(message)
  }
}

export class PaymentAlreadyConfirmedError extends ApplicationError {
  constructor(message = 'Payment has already been confirmed') {
    super(message)
  }
}

export class PaymentAccountInformationError extends ApplicationError {
  constructor(message = 'Missing payment account information') {
    super(message)
  }
}

export class PaymentProofUploadS3Error extends ApplicationError {
  constructor(message = "Can't upload payment proof to S3") {
    super(message)
  }
}

export class PaymentProofPresignS3Error extends ApplicationError {
  constructor(message = "Can't generate payment proof presign url from S3") {
    super(message)
  }
}
