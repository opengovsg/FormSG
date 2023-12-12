import { useMutation } from 'react-query'

import {
  FormAuthType,
  SubmitFormFeedbackBodyDto,
  SubmitFormIssueBodyDto,
} from '~shared/types/form'

import { useToast } from '~hooks/useToast'

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
  submitStorageModeClearForm,
  submitStorageModeClearFormWithFetch,
  submitStorageModeClearFormWithVirusScanning,
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
  submissionId?: string,
) => {
  console.log(submissionId)
  const submitEmailModeFormMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeForm({ ...args, formId })
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

  const submitStorageModeClearFormFetchMutation = useMutation(
    (args: Omit<SubmitStorageFormClearArgs, 'formId'>) => {
      return submitStorageModeClearFormWithFetch({ ...args, formId })
    },
  )

  const useSubmitClearFormWithVirusScanningMutation = (f: any) =>
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

  const submitStorageModeClearFormWithVirusScanningMutation =
    useSubmitClearFormWithVirusScanningMutation(
      submitStorageModeClearFormWithVirusScanning,
    )

  const submitMultirespondentFormMutation =
    useSubmitClearFormWithVirusScanningMutation(submitMultirespondentForm)

  const updateMultirespondentSubmissionMutation =
    useSubmitClearFormWithVirusScanningMutation(updateMultirespondentSubmission)

  return {
    submitEmailModeFormMutation,
    submitEmailModeFormFetchMutation,
    submitStorageModeClearFormMutation,
    submitStorageModeClearFormFetchMutation,
    submitStorageModeClearFormWithVirusScanningMutation,
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
        toast({ status: 'danger', description: error.message })
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
        toast({ status: 'danger', description: error.message })
      },
    },
  )
  return { submitFormIssueMutation }
}
