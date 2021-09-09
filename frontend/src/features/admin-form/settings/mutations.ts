import { useMutation, UseMutationResult, useQueryClient } from 'react-query'

import { FormId, FormSettings, FormStatus } from '~shared/types/form/form'

import { useToast } from '~hooks/useToast'

import { adminFormSettingsKeys } from './queries'
import { updateFormStatus } from './SettingsService'

type UseMutateFormSettingsProps = {
  formId: FormId
}
export const useMutateFormSettings = ({
  formId,
}: UseMutateFormSettingsProps): UseMutationResult<
  FormSettings,
  unknown,
  FormStatus,
  unknown
> => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation(
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
          status: 'success',
          description: toastStatusMessage,
          isClosable: true,
        })
      },
    },
  )
}
