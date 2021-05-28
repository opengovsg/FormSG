import { ErrorDto } from './core'

export type SubmissionResponseDto = {
  message: string
  submissionId: string
}

export type SubmissionErrorDto = ErrorDto & { spcpSubmissionFailure?: true }
