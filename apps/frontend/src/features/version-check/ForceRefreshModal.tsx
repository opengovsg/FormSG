import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react'

import { isBreakingVersionChange } from 'formsg-shared/utils/version'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { getBundleVersion, useServerAppVersion } from './queries'

export interface ForceRefreshModalProps {
  /** Version of the loaded frontend bundle. Defaults to the build-time version. */
  clientVersion?: string
  /** Called on refresh click. Defaults to a full page reload. */
  onRefresh?: () => void
}

/**
 * Non-dismissible modal shown when the deployed backend is a breaking
 * (major) version away from the loaded frontend bundle.
 */
export const ForceRefreshModal = ({
  clientVersion = getBundleVersion(),
  onRefresh = () => window.location.reload(),
}: ForceRefreshModalProps): JSX.Element | null => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.app.forceRefreshModal',
  })
  const isMobile = useIsMobile()
  const serverVersion = useServerAppVersion()

  const isOpen = isBreakingVersionChange(clientVersion, serverVersion)
  if (!isOpen) return null

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      size={isMobile ? 'mobile' : undefined}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('title')}</ModalHeader>
        <ModalBody>
          <Text textStyle="body-2" color="secondary.500">
            {t('body')}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button isFullWidth={isMobile} onClick={onRefresh}>
            {t('refreshButton')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
