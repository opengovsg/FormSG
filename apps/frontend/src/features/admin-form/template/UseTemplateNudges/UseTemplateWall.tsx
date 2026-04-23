import { useCallback, useEffect } from 'react'
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

import { useSessionStorage } from '~hooks/useSessionStorage'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { UseTemplateModal } from '~features/admin-form/template/UseTemplateModal'

export const USE_TEMPLATE_WALL_SESSION_KEY_PREFIX =
  'has-seen-use-template-wall-'

interface UseTemplateWallProps {
  formId: string
}

export const UseTemplateWall = ({
  formId,
}: UseTemplateWallProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.template.useTemplateWall',
  })
  const isMobile = useBreakpointValue({ base: true, md: false })

  const [hasSeen, setHasSeen] = useSessionStorage<boolean>(
    `${USE_TEMPLATE_WALL_SESSION_KEY_PREFIX}${formId}`,
    false,
  )

  const {
    isOpen: isWallOpen,
    onOpen: onWallOpen,
    onClose: onWallClose,
  } = useDisclosure()
  const {
    isOpen: isTemplateModalOpen,
    onOpen: onTemplateModalOpen,
    onClose: onTemplateModalClose,
  } = useDisclosure()

  const handleSentinelEnter = useCallback(() => {
    if (hasSeen) return
    onWallOpen()
  }, [hasSeen, onWallOpen])

  // Trigger when the point 1.5 viewport heights down the page becomes visible
  // (i.e. scrollTop + viewport >= 1.5 * viewport → scrollTop >= 0.5 * viewport),
  // or when the user reaches the bottom of a shorter form. Waits for a real
  // scroll event — never fires on mount.
  useEffect(() => {
    if (hasSeen) return
    const onScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      if (scrollTop <= 0) return
      const viewport = window.innerHeight
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      )
      const pastThreshold = scrollTop + viewport >= viewport * 1.5
      const nearBottom =
        docHeight > viewport && scrollTop + viewport >= docHeight - 4
      if (pastThreshold || nearBottom) {
        handleSentinelEnter()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll)
    }
  }, [handleSentinelEnter, hasSeen])

  const handleDismiss = useCallback(() => {
    setHasSeen(true)
    onWallClose()
  }, [onWallClose, setHasSeen])

  const handleUseTemplate = useCallback(() => {
    setHasSeen(true)
    onWallClose()
    onTemplateModalOpen()
  }, [onTemplateModalOpen, onWallClose, setHasSeen])

  return (
    <>
      <Modal
        isOpen={isWallOpen}
        onClose={handleDismiss}
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
              <Button
                variant="clear"
                onClick={handleDismiss}
                isFullWidth={isMobile}
              >
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
