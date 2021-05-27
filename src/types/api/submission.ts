import { RequireAtLeastOne } from 'type-fest'

import { ErrorDto } from './core'

export type SubmissionResponseDto = {
  message: string
  submissionId: string
}

export type SubmissionErrorDto = ErrorDto & { spcpSubmissionFailure?: true }

export type SubmissionCountDto = {
  formId: string
  startDate?: Date
  endDate?: Date
}

export type SubmissionMetadataDto = {
  formId: string
} & RequireAtLeastOne<{
  submissionId: string
  pageNum: number
}>
