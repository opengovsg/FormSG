import { ApplicationError, ErrorCodes } from '../core/core.errors'

export class InvoicePdfGenerationError extends ApplicationError {
  constructor(message = 'Error while generating invoice pdf') {
    super(message, undefined, ErrorCodes.PAYMENT_PROOF_INVOICE_PDF_GENERATION)
  }
}

export class PaymentProofUploadS3Error extends ApplicationError {
  constructor(message = "Can't upload payment proof to S3") {
    super(message, undefined, ErrorCodes.PAYMENT_PROOF_UPLOAD_S3)
  }
}

export class PaymentProofPresignS3Error extends ApplicationError {
  constructor(message = "Can't generate payment proof presign url from S3") {
    super(message, undefined, ErrorCodes.PAYMENT_PROOF_PRESIGN_S3)
  }
}
