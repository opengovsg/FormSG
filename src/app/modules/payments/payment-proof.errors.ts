import { ApplicationError } from '../core/core.errors'

export class InvoicePdfGenerationError extends ApplicationError {
  constructor(message = 'Error while generating invoice pdf') {
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
