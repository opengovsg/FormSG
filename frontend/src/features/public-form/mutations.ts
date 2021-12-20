import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'

import { useToast } from '~hooks/useToast'

import { getPublicFormAuthRedirectUrl } from './PublicFormService'

export const usePublicAuthMutations = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const toast = useToast({ status: 'danger', isClosable: true })

  const handleLoginMutation = useMutation(
    () => getPublicFormAuthRedirectUrl(formId),
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

  return { handleLoginMutation }
}
