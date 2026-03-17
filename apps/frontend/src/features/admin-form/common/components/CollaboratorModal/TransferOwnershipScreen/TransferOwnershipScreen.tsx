import { useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { useMutateCollaborators } from '~features/admin-form/common/mutations'

import { useCollaboratorWizard } from '../CollaboratorWizardContext'

export const TransferOwnershipScreen = (): JSX.Element | null => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.collaborator',
  })
  const { t: tCommon } = useTranslation()
  const isMobile = useIsMobile()
  const { mutateTransferFormOwnership } = useMutateCollaborators()
  const { handleBackToList, emailToTransfer } = useCollaboratorWizard()

  const handleTransferOwnership = useCallback(() => {
    if (!emailToTransfer) return
    return mutateTransferFormOwnership.mutate(emailToTransfer, {
      onSuccess: () => handleBackToList(),
    })
  }, [emailToTransfer, handleBackToList, mutateTransferFormOwnership])

  if (!emailToTransfer) return null

  return (
    <>
      <ModalHeader color="secondary.700">
        {t('transferOwnership.header')}
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        <Text>
          <Trans
            i18nKey="features.adminForm.collaborator.transferOwnership.message"
            values={{ email: emailToTransfer }}
            components={{
              email: <Text color="danger.500" as="span" fontWeight={700} />,
            }}
          />
        </Text>
      </ModalBody>
      <ModalFooter>
        <Stack
          flex={1}
          spacing="1rem"
          direction={{ base: 'column', md: 'row-reverse' }}
        >
          <Button
            isFullWidth={isMobile}
            isLoading={mutateTransferFormOwnership.isLoading}
            colorScheme="danger"
            onClick={handleTransferOwnership}
          >
            {t('transferOwnership.button.confirm')}
          </Button>
          <Button
            isFullWidth={isMobile}
            isDisabled={mutateTransferFormOwnership.isLoading}
            variant="clear"
            colorScheme="secondary"
            onClick={handleBackToList}
          >
            {tCommon('features.common.cancel')}
          </Button>
        </Stack>
      </ModalFooter>
    </>
  )
}
