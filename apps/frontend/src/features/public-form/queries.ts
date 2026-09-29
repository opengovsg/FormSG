import { useQuery, UseQueryResult } from 'react-query'

import { MrfStepAuthSessionDto } from 'formsg-shared/types/form'
import { PublicFormViewDto } from 'formsg-shared/types/form/form'

import { ApiError } from '~typings/core'

import { MONGODB_ID_REGEX } from '~constants/routes'

import {
  getAdminUseEmailModeFeedbackFormView,
  getMrfStepAuthSession,
  getMultirespondentSubmissionById,
  getPublicFormView,
} from './PublicFormService'
import { PublicMultirespondentSubmissionDtoWithAttachments } from './types'

export const publicFormKeys = {
  // All keys map to either an array or function returning an array for
  // consistency
  base: ['publicForm'] as const,
  id: (formId: string) => [...publicFormKeys.base, formId] as const,
  submission: (formId: string, submissionId?: string) =>
    [...publicFormKeys.id(formId), submissionId] as const,
  mrfStepAuth: (formId: string, submissionId: string) =>
    [...publicFormKeys.submission(formId, submissionId), 'stepAuth'] as const,
}

export const usePublicFormView = (
  formId: string,
  /** Extra override to determine whether query is enabled */
  enabled = true,
  /** Later MRF step: Step 1's login is neither shown nor consumed */
  isMrfContinuation = false,
): UseQueryResult<PublicFormViewDto, ApiError> => {
  return useQuery<PublicFormViewDto, ApiError>(
    isMrfContinuation
      ? [...publicFormKeys.id(formId), 'mrfContinuation']
      : publicFormKeys.id(formId),
    () => getPublicFormView(formId, isMrfContinuation),
    {
      // Treat form as static on load.
      staleTime: Infinity,
      enabled: MONGODB_ID_REGEX.test(formId) && enabled,
    },
  )
}

/**
 * Login policy and session for the pending step of an MRF submission.
 * Fetched once: it completes a MyInfo login, which can only be read once.
 */
export const useMrfStepAuthSession = ({
  formId,
  submissionId,
  stepToken,
  enabled,
}: {
  formId: string
  submissionId?: string
  stepToken?: string
  enabled: boolean
}): UseQueryResult<MrfStepAuthSessionDto, ApiError> => {
  return useQuery<MrfStepAuthSessionDto, ApiError>(
    publicFormKeys.mrfStepAuth(formId, submissionId ?? ''),
    () =>
      getMrfStepAuthSession({
        formId,
        submissionId: submissionId ?? '',
        stepToken,
      }),
    {
      staleTime: Infinity,
      enabled:
        enabled &&
        MONGODB_ID_REGEX.test(formId) &&
        !!submissionId &&
        MONGODB_ID_REGEX.test(submissionId),
    },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useEncryptedSubmission = (
  formId: string,
  submissionId?: string,
  /** Extra override to determine whether query is enabled */
  enabled = true,
): UseQueryResult<
  PublicMultirespondentSubmissionDtoWithAttachments,
  ApiError
> => {
  return useQuery(
    publicFormKeys.submission(formId, submissionId),
    () =>
      submissionId
        ? getMultirespondentSubmissionById({ formId, submissionId })
        : undefined,
    {
      // Treat submission as static on load.
      staleTime: Infinity,
      enabled:
        MONGODB_ID_REGEX.test(formId) &&
        (!submissionId || MONGODB_ID_REGEX.test(submissionId)) &&
        enabled,
    },
  )
}

/**
 * TODO: (Kill Email Mode) Remove this after kill email mode is fully implemented.
 * Queries the BE defined feedback form for admins to answer why they are using email mode
 * @returns
 */
export const useAdminUseEmailModeFormView = (): UseQueryResult<
  PublicFormViewDto,
  ApiError
> => {
  return useQuery<PublicFormViewDto, ApiError>(
    publicFormKeys.id('useAdminUseEmailModeFormView'),
    () => getAdminUseEmailModeFeedbackFormView(),
    {},
  )
}
