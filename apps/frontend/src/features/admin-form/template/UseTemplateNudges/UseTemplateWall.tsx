import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { UseTemplateModal } from '~features/admin-form/template/UseTemplateModal'

interface UseTemplateWallProps {
  formId: string
  isOpen: boolean
  onClose: () => void
}

export const UseTemplateWall = ({
  formId,
  isOpen,
  onClose,
}: UseTemplateWallProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.template.useTemplateWall',
  })
  const isMobile = useBreakpointValue({ base: true, md: false })

  const {
    isOpen: isTemplateModalOpen,
    onOpen: onTemplateModalOpen,
    onClose: onTemplateModalClose,
  } = useDisclosure()

  const handleUseTemplate = useCallback(() => {
    onClose()
    onTemplateModalOpen()
  }, [onClose, onTemplateModalOpen])

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
        size={isMobile ? 'mobile' : undefined}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader pr="3rem">{t('title')}</ModalHeader>
          <ModalBody>
            <Text textStyle="body-2" color="secondary.500">
              {t('body')}
            </Text>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup
              w={isMobile ? '100%' : undefined}
              flexDir={isMobile ? 'column-reverse' : 'row'}
            >
              <Button variant="clear" onClick={onClose} isFullWidth={isMobile}>
                {t('continuePreview')}
              </Button>
              <Button onClick={handleUseTemplate} isFullWidth={isMobile}>
                {t('useTemplate')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <UseTemplateModal
        formId={formId}
        isOpen={isTemplateModalOpen}
        onClose={onTemplateModalClose}
      />
    </>
  )
}
