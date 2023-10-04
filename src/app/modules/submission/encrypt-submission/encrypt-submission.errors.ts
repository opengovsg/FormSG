import { FormResponseMode } from '../../../../../shared/types'
import { ApplicationError } from '../../core/core.errors'
import { fileSizeLimit } from '../submission.utils'

export class FormsgReqBodyExistsError extends ApplicationError {
  constructor(
    message = 'The formsg key already exists in request. Please check that you are not overwriting it.',
  ) {
    super(message)
  }
}

export class EncryptedPayloadExistsError extends ApplicationError {
  constructor(
    message = 'Encrypted payload already exists in req.formsg. Please check that you are not overwriting it.',
  ) {
    super(message)
  }
}

export class SubmissionFailedError extends ApplicationError {
  constructor(
    message = 'The form submission could not be processed. Please try again.',
  ) {
    super(message)
  }
}

export class InvalidFieldIdError extends ApplicationError {
  constructor(
    message = 'Invalid field id. Field id should be a valid MongoDB ObjectId.',
  ) {
    super(message)
  }
}

export class AttachmentSizeLimitExceededError extends ApplicationError {
  constructor(
    message = `Total attachment size exceeds ${fileSizeLimit(
      FormResponseMode.Encrypt,
    )}MB. Please reduce your total attachment size and try again.`,
  ) {
    super(message)
  }
}

export class FeatureDisabledError extends ApplicationError {
  constructor(message = 'This feature is disabled.') {
    super(message)
  }
}

export class InvalidFileKeyError extends ApplicationError {
  constructor(message = 'Invalid file key. File keys should be valid UUIDs.') {
    super(message)
  }
}

export class VirusScanFailedError extends ApplicationError {
  constructor(message = 'Virus scan failed. Please try again.') {
    super(message)
  }
}

export class JsonParseFailedError extends ApplicationError {
  constructor(message = 'JSON parsing failed. Please try again.') {
    super(message)
  }
}

export class DownloadCleanFileFailedError extends ApplicationError {
  constructor(
    message = 'Attempt to download clean file failed. Please try again.',
  ) {
    super(message)
  }
}

export class ParseVirusScannerLambdaPayloadError extends ApplicationError {
  constructor(message = 'Unexpected payload from virus scanning lambda.') {
    super(message)
  }
}

export class MaliciousFileDetectedError extends ApplicationError {
  constructor(
    message = 'Your attachment(s) has failed our virus scan. Try creating and uploading it again.',
  ) {
    super(message)
  }
}
