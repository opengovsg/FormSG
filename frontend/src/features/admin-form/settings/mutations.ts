import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormId, FormStatus } from '~shared/types/form/form'

import { useToast } from '~hooks/useToast'

import { adminFormSettingsKeys } from './queries'
import { updateFormStatus } from './SettingsService'

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

  return { mutateFormStatus }
}
