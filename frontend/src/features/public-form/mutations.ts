import { useMutation } from 'react-query'

import {
  FormAuthType,
  SubmitFormFeedbackBodyDto,
  SubmitFormIssueBodyDto,
} from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { useStorePrefillQuery } from './hooks/useStorePrefillQuery'
import {
  getAttachmentPresignedPostData,
  getPublicFormAuthRedirectUrl,
  logoutPublicForm,
  SubmitEmailFormArgs,
  submitEmailModeForm,
  submitEmailModeFormWithFetch,
  submitFormFeedback,
  submitFormIssue,
  SubmitStorageFormArgs,
  SubmitStorageFormClearArgs,
  submitStorageModeClearForm,
  submitStorageModeClearFormWithFetch,
  submitStorageModeForm,
  submitStorageModeFormWithFetch,
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
          status: 'danger',
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
  submissionId: string,
) => {
  const toast = useToast({ isClosable: true })

  const submitEmailModeFormMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeForm({ ...args, formId })
    },
  )

  const submitStorageModeFormMutation = useMutation(
    (args: Omit<SubmitStorageFormArgs, 'formId'>) => {
      return submitStorageModeForm({ ...args, formId })
    },
  )

  const submitStorageModeClearFormMutation = useMutation(
    (args: Omit<SubmitStorageFormClearArgs, 'formId'>) => {
      return submitStorageModeClearForm({ ...args, formId })
    },
  )

  // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
  const submitEmailModeFormFetchMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeFormWithFetch({ ...args, formId })
    },
  )

  const submitStorageModeFormFetchMutation = useMutation(
    (args: Omit<SubmitStorageFormArgs, 'formId'>) => {
      return submitStorageModeFormWithFetch({ ...args, formId })
    },
  )

  const submitStorageModeClearFormFetchMutation = useMutation(
    (args: Omit<SubmitStorageFormClearArgs, 'formId'>) => {
      return submitStorageModeClearFormWithFetch({ ...args, formId })
    },
  )

  const submitFormFeedbackMutation = useMutation(
    (args: SubmitFormFeedbackBodyDto) =>
      submitFormFeedback(formId, submissionId, args),
    {
      onError: (error: Error) => {
        toast({ status: 'danger', description: error.message })
      },
    },
  )

  const submitStorageModeClearFormWithVirusScanningMutation = useMutation(
    (args: Omit<SubmitStorageFormClearArgs, 'formId'>) => {
      // Step 1: Get presigned post data for all attachment fields
      return getAttachmentPresignedPostData({ ...args, formId }).then(
        // Step 2: Upload attachments to quarantine bucket asynchronously
        (presignedPostDataList) =>
          Promise.all(
            presignedPostDataList.map(async (presignedPostData) => {
              const attachmentFile = args.formInputs[presignedPostData.id]

              // Check if response is a File object (from an attachment field)
              if (!(attachmentFile instanceof File))
                throw new Error('Field is not attachment')

              const uploadResponse = await uploadAttachmentToQuarantine(
                presignedPostData.presignedPostData,
                attachmentFile,
              )

              // // If status code is not 200-299, throw error
              if (uploadResponse.status < 200 || uploadResponse.status > 299)
                throw new Error(
                  `Attachment upload failed - ${uploadResponse.statusText}`,
                )

              return {
                fieldId: presignedPostData.id,
                uploadResponse,
              }
            }),
          ),
      )
    },
  )

  return {
    submitEmailModeFormMutation,
    submitStorageModeFormMutation,
    submitFormFeedbackMutation,
    submitStorageModeFormFetchMutation,
    submitEmailModeFormFetchMutation,
    submitStorageModeClearFormMutation,
    submitStorageModeClearFormFetchMutation,
    submitStorageModeClearFormWithVirusScanningMutation,
  }
}

export const useSubmitFormIssueMutations = (formId: string) => {
  const toast = useToast({ isClosable: true })

  const submitFormIssueMutation = useMutation(
    (args: SubmitFormIssueBodyDto) => submitFormIssue(formId, args),
    {
      onError: (error: Error) => {
        toast({ status: 'danger', description: error.message })
      },
    },
  )
  return { submitFormIssueMutation }
}
