import { useMutation } from 'react-query'
import { useToast } from '@opengovsg/design-system-react'

import { SubmissionResponseDto } from '~shared/types'
import {
  FormAuthType,
  SubmitFormFeedbackBodyDto,
  SubmitFormIssueBodyDto,
} from '~shared/types/form'

import { useStorePrefillQuery } from './hooks/useStorePrefillQuery'
import {
  FieldIdToQuarantineKeyType,
  getAttachmentPresignedPostData,
  getAttachmentSizes,
  getPublicFormAuthRedirectUrl,
  logoutPublicForm,
  SubmitEmailFormArgs,
  submitEmailModeForm,
  submitEmailModeFormWithFetch,
  submitFormFeedback,
  submitFormIssue,
  submitMultirespondentForm,
  SubmitStorageFormClearArgs,
  submitStorageModeForm,
  submitStorageModeFormWithFetch,
  updateMultirespondentSubmission,
  uploadAttachmentToQuarantine,
} from './PublicFormService'

export const usePublicAuthMutations = (formId: string) => {
  const { storePrefillQuery } = useStorePrefillQuery()

  const toast = useToast({ status: 'success', isClosable: true })

  const handleLoginMutation = useMutation(
    () => {
      const encodedQuery = storePrefillQuery()
      return getPublicFormAuthRedirectUrl(formId, false, encodedQuery)
    },
    {
      onSuccess: (redirectUrl) => {
        window.location.assign(redirectUrl)
      },
      onError: (error: Error) => {
        toast({
          description: error.message,
          status: 'error',
        })
      },
    },
  )

  const handleLogoutMutation = useMutation(
    (authType: Exclude<FormAuthType, FormAuthType.NIL>) =>
      logoutPublicForm(authType),
    {
      onSuccess: () => {
        // Refresh browser to reset form state.
        window.location.reload()
      },
    },
  )

  return {
    handleLoginMutation,
    handleLogoutMutation,
  }
}

export const usePublicFormMutations = (
  formId: string,
  submissionId?: string,
  submissionSecretKey?: string,
) => {
  const submitEmailModeFormMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeForm({ ...args, formId })
    },
  )

  // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
  const submitEmailModeFormFetchMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeFormWithFetch({ ...args, formId })
    },
  )

  const useSubmitStorageModeFormMutation = (
    f: (
      args: SubmitStorageFormClearArgs & {
        fieldIdToQuarantineKeyMap: FieldIdToQuarantineKeyType[]
        submissionId: typeof submissionId
      },
    ) => Promise<SubmissionResponseDto>,
  ) =>
    useMutation(async (args: Omit<SubmitStorageFormClearArgs, 'formId'>) => {
      const attachmentSizes = await getAttachmentSizes(args)
      // If there are no attachments, submit form without virus scanning by passing in empty list
      if (attachmentSizes.length === 0) {
        return f({
          ...args,
          fieldIdToQuarantineKeyMap: [],
          formId,
          submissionId,
        })
      }
      // Step 1: Get presigned post data for all attachment fields
      return (
        getAttachmentPresignedPostData({ ...args, formId, attachmentSizes })
          .then(
            // Step 2: Upload attachments to quarantine bucket asynchronously
            (fieldToPresignedPostDataMap) =>
              Promise.all(
                fieldToPresignedPostDataMap.map(
                  async (fieldToPresignedPostData) => {
                    const attachmentFile =
                      args.formInputs[fieldToPresignedPostData.id]

                    // Check if response is a File object (from an attachment field)
                    if (!(attachmentFile instanceof File))
                      throw new Error('Field is not attachment')

                    const uploadResponse = await uploadAttachmentToQuarantine(
                      fieldToPresignedPostData.presignedPostData,
                      attachmentFile,
                    )

                    // If status code is not 200-299, throw error
                    if (
                      uploadResponse.status < 200 ||
                      uploadResponse.status > 299
                    )
                      throw new Error(
                        `Attachment upload failed - ${uploadResponse.statusText}`,
                      )

                    const quarantineBucketKey =
                      fieldToPresignedPostData.presignedPostData.fields.key

                    if (!quarantineBucketKey)
                      throw new Error(
                        'key is not defined in presigned post data',
                      )

                    return {
                      fieldId: fieldToPresignedPostData.id,
                      quarantineBucketKey,
                    } as FieldIdToQuarantineKeyType
                  },
                ),
              ),
          )
          // Step 3: Submit form with keys to quarantine bucket attachments
          .then((fieldIdToQuarantineKeyMap) => {
            return f({
              ...args,
              fieldIdToQuarantineKeyMap,
              formId,
              submissionId,
            })
          })
      )
    })

  const submitStorageModeFormMutation = useSubmitStorageModeFormMutation(
    submitStorageModeForm,
  )

  const submitStorageModeFormFetchMutation = useSubmitStorageModeFormMutation(
    submitStorageModeFormWithFetch,
  )

  const submitMultirespondentFormMutation = useSubmitStorageModeFormMutation(
    submitMultirespondentForm,
  )

  const updateMultirespondentSubmissionMutation =
    useSubmitStorageModeFormMutation((args) =>
      updateMultirespondentSubmission({ ...args, submissionSecretKey }),
    )

  return {
    submitEmailModeFormMutation,
    submitEmailModeFormFetchMutation,
    submitStorageModeFormMutation,
    submitStorageModeFormFetchMutation,
    submitMultirespondentFormMutation,
    updateMultirespondentSubmissionMutation,
  }
}

export const useSubmitFormFeedbackMutation = (
  formId: string,
  submissionId: string,
) => {
  const toast = useToast({ isClosable: true })

  const submitFormFeedbackMutation = useMutation(
    (args: SubmitFormFeedbackBodyDto) =>
      submitFormFeedback(formId, submissionId, args),
    {
      onError: (error: Error) => {
        toast({ status: 'error', description: error.message })
      },
    },
  )

  return { submitFormFeedbackMutation }
}

export const useSubmitFormIssueMutations = (formId: string) => {
  const toast = useToast({ isClosable: true })

  const submitFormIssueMutation = useMutation(
    (args: SubmitFormIssueBodyDto) => submitFormIssue(formId, args),
    {
      onError: (error: Error) => {
        toast({ status: 'error', description: error.message })
      },
    },
  )
  return { submitFormIssueMutation }
}
