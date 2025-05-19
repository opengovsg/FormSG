import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import formsgSdk from '~utils/formSdk'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { convertEmailToStorageMode } from '~features/admin-form/email-migration/EmailToStorageMigrationService'
import { trackClickSecretKeyMailToEmailToStorageConvertedForm } from '~features/analytics/AnalyticsService'
import {
  SaveSecretKeyContent,
  SaveSecretKeyFormInput,
} from '~features/workspace/components/CreateFormModal/CreateFormModalContent/SaveSecretKeyContent'

import { useToast } from '../../../../hooks/useToast'
import { adminFormSettingsKeys } from '../queries'

export interface EmailModeConvertModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  formTitle: string
  formId: string
}

export const EmailModeConvertModal = ({
  isOpen,
  onClose,
  formTitle,
  formId,
}: EmailModeConvertModalProps): JSX.Element => {
  const queryClient = useQueryClient()

  const { t } = useTranslation()

  const { publicKey, secretKey } = useMemo(
    () => formsgSdk.crypto.generate(),
    [],
  )

  const {
    register,
    formState: { isValid: isFormStateValid },
  } = useForm<SaveSecretKeyFormInput>({
    defaultValues: {
      storageAck: false,
    },
  })

  const toast = useToast()

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  const convertEmailToStorageModeMutation = useMutation(
    convertEmailToStorageMode,
    {
      onSuccess: () => {
        toast.closeAll()
        toast({
          description: t(
            'features.adminForm.toasts.emailModeMigration.success',
          ),
          status: 'success',
          isClosable: true,
        })
        queryClient.invalidateQueries(adminFormKeys.id(formId))
        queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
        onClose()
      },
      onError: () => {
        toast.closeAll()
        toast({
          description: t('features.adminForm.toasts.emailModeMigration.error'),
          status: 'error',
          isClosable: true,
        })
      },
    },
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <SaveSecretKeyContent
          contentTitle={t('features.adminForm.modals.emailModeMigration.title')}
          registerStorageAck={register}
          isLoading={convertEmailToStorageModeMutation.isLoading}
          secretKey={secretKey}
          formTitle={formTitle}
          formId={formId}
          onClose={onClose}
          isFormStateValid={isFormStateValid}
          onSubmitClick={() => {
            convertEmailToStorageModeMutation.mutate({ formId, publicKey })
          }}
          handleTrackEmail={() =>
            trackClickSecretKeyMailToEmailToStorageConvertedForm(formId)
          }
        />
      </ModalContent>
    </Modal>
  )
}
