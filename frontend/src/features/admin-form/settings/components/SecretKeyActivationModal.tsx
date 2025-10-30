import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.general.secretKeyModal',
  })
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
      modalActionText={t('activationTitle')}
      submitButtonText={t('activateButton')}
      onSubmit={onSubmit}
      hasAck
    />
  )
}
