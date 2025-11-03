import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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

export const RemoveSelfScreen = (): JSX.Element | null => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.collaborator',
  })
  const { t: tCommon } = useTranslation()
  const isMobile = useIsMobile()
  const { mutateRemoveSelf } = useMutateCollaborators()
  const { handleBackToList, onClose } = useCollaboratorWizard()

  const handleRemoveSelf = useCallback(() => {
    return mutateRemoveSelf.mutate(undefined, { onSuccess: onClose })
  }, [mutateRemoveSelf, onClose])

  return (
    <>
      <ModalHeader color="secondary.700">{t('removeSelf.header')}</ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        <Text>{t('removeSelf.message')}</Text>
      </ModalBody>
      <ModalFooter>
        <Stack
          flex={1}
          spacing="1rem"
          direction={{ base: 'column', md: 'row-reverse' }}
        >
          <Button
            isFullWidth={isMobile}
            isLoading={mutateRemoveSelf.isLoading}
            colorScheme="danger"
            onClick={handleRemoveSelf}
          >
            {t('removeSelf.button.confirm')}
          </Button>
          <Button
            isFullWidth={isMobile}
            isDisabled={mutateRemoveSelf.isLoading}
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
