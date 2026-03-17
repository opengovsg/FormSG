import { useTranslation } from 'react-i18next'
import {
  Badge,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface CanceledScreenProps {
  onClose: () => void
}

export const CanceledScreen = ({
  onClose,
}: CanceledScreenProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>
            {t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadWithAttachmentModal.canceledScreen.downloadStopped',
            )}
          </Text>
          <Badge w="fit-content" colorScheme="success">
            {t('features.common.betaBadgeLabel')}
          </Badge>
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        {t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadWithAttachmentModal.canceledScreen.title',
        )}
      </ModalBody>
      <ModalFooter>
        <Button isFullWidth={isMobile} onClick={onClose}>
          {t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadWithAttachmentModal.canceledScreen.backToResponses',
          )}
        </Button>
      </ModalFooter>
    </>
  )
}
