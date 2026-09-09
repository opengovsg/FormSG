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
  /**
   * Version of the loaded frontend bundle. Injectable for tests and stories;
   * defaults to the version baked in at build time.
   */
  clientVersion?: string
  /**
   * Called when the user clicks the refresh button. Injectable for tests;
   * defaults to a full page reload, which fetches the new bundle.
   */
  onRefresh?: () => void
}

/**
 * Non-dismissible modal shown when the deployed backend is a breaking
 * (major) version away from the loaded frontend bundle. The only way out is
 * to refresh, which loads the bundle matching the current backend.
 *
 * Mounted only on authenticated admin routes (see PrivateElement) so an
 * in-progress public form submission is never interrupted.
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
      // Modal is intentionally not dismissible: the loaded bundle can no
      // longer be assumed compatible with the deployed backend.
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
