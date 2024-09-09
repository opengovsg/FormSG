import { UseDisclosureReturn } from '@chakra-ui/react'

import { FormStatus } from '~shared/types/form/form'

import { useMutateFormSettings } from '../mutations'

import { SecretKeyFormModal } from './SecretKeyFormModal'

export interface SecretKeyActivationModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  publicKey: string
}

export const SecretKeyActivationModal = ({
  onClose,
  isOpen,
  publicKey,
}: SecretKeyActivationModalProps): JSX.Element => {
  const { mutateFormStatus } = useMutateFormSettings()

  const onSubmit = () => {
    return mutateFormStatus.mutate(FormStatus.Public, { onSuccess: onClose })
  }
  const isLoading = mutateFormStatus.isLoading

  return (
    <SecretKeyFormModal
      isLoading={isLoading}
      onClose={onClose}
      isOpen={isOpen}
      publicKey={publicKey}
      modalActionText="Activate your form"
      submitButtonText="Activate form"
      onSubmit={onSubmit}
      hasAck
    />
  )
}
