import { ErrorDto } from './core'

export type SubmissionResponseDto = {
  message: string
  submissionId: string
}

export type SubmissionErrorDto = ErrorDto & { spcpSubmissionFailure?: true }

export type SubmissionCountQueryDto = {
  formId: string
  dates?: {
    startDate: Date
    endDate: Date
  }
}

export type FormsSubmissionMetadataQueryDto = {
  formId: string
  pageNum: number
}

export type FormSubmissionMetadataQueryDto = {
  formId: string
  submissionId: string
}

export type SubmissionResponseQueryDto = {
  formId: string
  submissionId: string
}
