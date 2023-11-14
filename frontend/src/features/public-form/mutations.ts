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
  SubmitStorageFormClearArgs,
  submitStorageModeFormWithVirusScanning,
  submitStorageModeFormWithVirusScanningWithFetch,
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

  // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
  const submitEmailModeFormFetchMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeFormWithFetch({ ...args, formId })
    },
  )

  const submitStorageModeFormWithVirusScanningFetchMutation = useMutation(
    async (args: Omit<SubmitStorageFormClearArgs, 'formId'>) => {
      const attachmentSizes = await getAttachmentSizes(args)
      // If there are no attachments, submit form without virus scanning by passing in empty list
      if (attachmentSizes.length === 0) {
        return submitStorageModeFormWithVirusScanningWithFetch({
          ...args,
          fieldIdToQuarantineKeyMap: [],
          formId,
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
            return submitStorageModeFormWithVirusScanningWithFetch({
              ...args,
              fieldIdToQuarantineKeyMap,
              formId,
            })
          })
      )
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

  const submitStorageModeFormWithVirusScanningMutation = useMutation(
    async (args: Omit<SubmitStorageFormClearArgs, 'formId'>) => {
      const attachmentSizes = await getAttachmentSizes(args)
      // If there are no attachments, submit form without virus scanning by passing in empty list
      if (attachmentSizes.length === 0) {
        return submitStorageModeFormWithVirusScanning({
          ...args,
          fieldIdToQuarantineKeyMap: [],
          formId,
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
            return submitStorageModeFormWithVirusScanning({
              ...args,
              fieldIdToQuarantineKeyMap,
              formId,
            })
          })
      )
    },
  )

  return {
    submitEmailModeFormMutation,
    submitFormFeedbackMutation,
    submitEmailModeFormFetchMutation,
    submitStorageModeFormWithVirusScanningFetchMutation,
    submitStorageModeFormWithVirusScanningMutation,
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
