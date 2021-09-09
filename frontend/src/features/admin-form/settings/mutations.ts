import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import simplur from 'simplur'

import { FormId, FormStatus } from '~shared/types/form/form'

import { useToast } from '~hooks/useToast'
import { formatOrdinal } from '~utils/stringFormat'

import { adminFormSettingsKeys } from './queries'
import { updateFormLimit, updateFormStatus } from './SettingsService'

export const useMutateFormSettings = () => {
  const { formId } = useParams<{ formId: FormId }>()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const mutateFormStatus = useMutation(
    (nextStatus: FormStatus) => updateFormStatus(formId, nextStatus),
    {
      onSuccess: (newData) => {
        // Update new settings data in cache.
        queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)

        // Show toast on success.
        const isNowPublic = newData.status === FormStatus.Public
        const toastStatusMessage = isNowPublic
          ? `Congrats! Your form is now open for submission.\n\nFor high-traffic forms, [AutoArchive your mailbox](https://go.gov.sg/form-prevent-bounce) to prevent lost responses.`
          : 'Your form is closed for submission.'
        toast({
          description: toastStatusMessage,
        })
      },
    },
  )

  const mutateFormLimit = useMutation(
    (nextLimit: number | null) => updateFormLimit(formId, nextLimit),
    {
      onSuccess: (newData) => {
        // Update new settings data in cache.
        queryClient.setQueryData(adminFormSettingsKeys.id(formId), newData)

        // Show toast on success.
        const toastStatusMessage = newData.submissionLimit
          ? simplur`Your form will now automatically close on the ${[
              newData.submissionLimit,
              formatOrdinal,
            ]} submission.`
          : 'The submission limit on your form is removed.'
        toast({
          description: toastStatusMessage,
        })
      },
    },
  )

  return { mutateFormStatus, mutateFormLimit }
}
