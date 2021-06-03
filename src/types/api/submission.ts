import { RequireAtLeastOne } from 'type-fest'

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

export type SubmissionMetadataQueryDto = {
  formId: string
} & RequireAtLeastOne<{
  submissionId: string
  pageNum: number
}>

export type SubmissionResponseQueryDto = {
  formId: string
  submissionId: string
}
