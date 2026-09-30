import type { UseQueryResult } from 'react-query'
import type { FormField } from '@opengovsg/formsg-sdk/dist/types'

import {
  BasicField,
  SubmissionId,
  SubmissionMetadataList,
  WorkflowStatus,
} from 'formsg-shared/types'

import type { getDecryptedSubmissionById } from '../AdminSubmissionsService'

import type { PrototypeResponse } from './model'

export const answersFor = (r: PrototypeResponse) =>
  r.answers.map((a, i) => ({
    _id: a.id,
    question: a.label,
    answer: a.value,
    fieldType: BasicField.ShortText,
    questionNumber: i + 1,
  })) as FormField[]
export const metadataFor = (
  responses: PrototypeResponse[],
): SubmissionMetadataList => ({
  count: responses.length,
  metadata: responses.map((r, i) => ({
    number: i + 1,
    refNo: r.id as SubmissionId,
    submissionTime: new Date(r.submittedAt).toLocaleString('en-SG'),
    payments: null,
    prototypeStatus: r.status,
    mrf: {
      workflowStatus:
        r.status === 'completed'
          ? WorkflowStatus.COMPLETED
          : r.status === 'rejected'
            ? WorkflowStatus.REJECTED
            : WorkflowStatus.PENDING,
      // FormSG metadata stores the last completed step; the model stores the pending step.
      workflowCurrentStepNumber:
        r.status === 'completed'
          ? r.steps.length
          : Math.max(
              0,
              (r.steps.find((s) => s.id === r.currentStepId)?.number ?? 1) - 1,
            ),
      workflowNumTotalSteps: r.steps.length,
      lastSubmittedAt: r.submittedAt,
      hasNextStepRecipientEmails: false,
    },
  })),
})
export function individualFor(
  r: PrototypeResponse,
): NonNullable<Awaited<ReturnType<typeof getDecryptedSubmissionById>>> {
  return {
    refNo: r.id as SubmissionId,
    submissionTime: new Date(r.submittedAt).toLocaleString('en-SG'),
    submissionSecretKey: 'prototype-no-key-required',
    payment: undefined,
    mrf: metadataFor([r]).metadata[0].mrf,
    responses: answersFor(r),
    mrfVersion: undefined,
    stepToken: undefined,
  }
}
export function localQuery<T>(
  query: UseQueryResult<T>,
  data: T,
): UseQueryResult<T> {
  return {
    ...query,
    data,
    isLoading: false,
    isError: false,
    isSuccess: true,
    isIdle: false,
    status: 'success',
    error: null,
  } as UseQueryResult<T>
}
