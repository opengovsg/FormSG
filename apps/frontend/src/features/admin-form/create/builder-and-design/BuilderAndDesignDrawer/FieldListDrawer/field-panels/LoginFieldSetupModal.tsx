import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react'

import { ADMINFORM_SETTINGS_SINGPASS_SUBROUTE } from '~constants/routes'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'

import {
  isDirtySelector,
  useDirtyFieldStore,
} from '../../../useDirtyFieldStore'

export const LoginFieldSetupModal = ({
  loginName,
  destination,
  onClose,
}: {
  loginName: string
  destination: 'settings' | 'workflow'
  onClose: () => void
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity.setup',
  })
  const { t: tCommon } = useTranslation()
  const navigate = useNavigate()
  const { handleWorkflowClick } = useCreatePageSidebar()
  const isDirty = useDirtyFieldStore(isDirtySelector)
  const handleContinue = () => {
    onClose()
    if (destination === 'workflow') handleWorkflowClick(isDirty)
    else navigate(ADMINFORM_SETTINGS_SINGPASS_SUBROUTE)
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{t('title', { loginName })}</ModalHeader>
        <ModalBody>
          <Text>{t(destination, { loginName })}</Text>
        </ModalBody>
        <ModalFooter gap="1rem">
          <Button variant="clear" colorScheme="secondary" onClick={onClose}>
            {tCommon('features.common.cancel')}
          </Button>
          <Button onClick={handleContinue}>{t(`${destination}Action`)}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
