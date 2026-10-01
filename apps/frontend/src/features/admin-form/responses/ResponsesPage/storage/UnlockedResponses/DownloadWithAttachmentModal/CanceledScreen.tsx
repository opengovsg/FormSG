import { useTranslation } from 'react-i18next'
import {
  Badge,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { responsesPageNs } from '~/i18n/locales/features/admin-form/responses/responses-page'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface CanceledScreenProps {
  onClose: () => void
  isBeta?: boolean
}

export const CanceledScreen = ({
  onClose,
  isBeta = true,
}: CanceledScreenProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { t } = useTranslation(responsesPageNs)
  const { t: tCommon } = useTranslation('translation', {
    keyPrefix: 'features.common',
  })

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>
            {t(
              'storage.unlockedResponses.downloadWithAttachmentModal.canceledScreen.downloadStopped',
            )}
          </Text>
          {isBeta ? (
            <Badge
              w="fit-content"
              colorScheme="primary"
              variant="subtle"
              color="secondary.500"
            >
              {tCommon('betaBadgeLabel')}
            </Badge>
          ) : null}
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        {t(
          'storage.unlockedResponses.downloadWithAttachmentModal.canceledScreen.title',
        )}
      </ModalBody>
      <ModalFooter>
        <Button isFullWidth={isMobile} onClick={onClose}>
          {t(
            'storage.unlockedResponses.downloadWithAttachmentModal.canceledScreen.backToResponses',
          )}
        </Button>
      </ModalFooter>
    </>
  )
}
