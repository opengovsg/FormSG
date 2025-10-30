import { Trans, useTranslation } from 'react-i18next'
import { BiCheck } from 'react-icons/bi'
import {
  Badge,
  Flex,
  List,
  ListIcon,
  ListItem,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

const InlineTextListItem = ({
  children,
}: {
  children: string
}): JSX.Element => (
  <ListItem display="flex">
    <Flex h="1.5rem" align="center">
      <ListIcon as={BiCheck} />
    </Flex>
    {children}
  </ListItem>
)

interface ConfirmationScreenProps {
  onCancel: () => void
  onDownload: () => void
  isDownloading: boolean
  responsesCount: number
}

export const ConfirmationScreen = ({
  onCancel,
  isDownloading,
  onDownload,
  responsesCount,
}: ConfirmationScreenProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.responsesPage',
  })

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>
            {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.title')}
          </Text>
          <Badge w="fit-content" colorScheme="success">
            {t('features.common.betaBadgeLabel')}
          </Badge>
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        <Stack spacing="1rem">
          <Text>
            <Trans
              i18nKey="storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.description"
              t={t}
              components={{ b: <b /> }}
            />
            <br />
            <br />
            <b>
              {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.numberOfResponsesAndAttachments')}
              :
            </b>{' '}
            {responsesCount.toLocaleString()}
            <br />
            <b>
              {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.estimatedTime')}
              :
            </b>{' '}
            {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.estimatedTimeReference')}
          </Text>
          <InlineMessage>
            <Stack>
              <Text textStyle="subhead-1">
                {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.intensiveOperationWarning.title')}
              </Text>
              <List>
                <InlineTextListItem>
                  {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.intensiveOperationWarning.doNotUseIE')}
                </InlineTextListItem>
                <InlineTextListItem>
                  {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.intensiveOperationWarning.ensureStrongNetworkConnectivity')}
                </InlineTextListItem>
                <InlineTextListItem>
                  {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.intensiveOperationWarning.ensureEnoughDiskSpace')}
                </InlineTextListItem>
              </List>
            </Stack>
          </InlineMessage>
          {responsesCount === 0 && (
            <InlineMessage variant="warning">
              {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.noResponsesInSelectedDateRange')}
            </InlineMessage>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Stack
          direction={{ base: 'column', md: 'row-reverse' }}
          w="100%"
          justify="end"
        >
          <Button
            isFullWidth={isMobile}
            onClick={onDownload}
            isLoading={isDownloading}
            isDisabled={responsesCount === 0}
          >
            {t('storage.unlockedResponses.downloadWithAttachmentModal.confirmationScreen.startDownload')}
          </Button>
          <Button
            isFullWidth={isMobile}
            variant="clear"
            colorScheme="secondary"
            onClick={onCancel}
            isDisabled={isDownloading}
          >
            {t('features.common.cancel')}
          </Button>
        </Stack>
      </ModalFooter>
    </>
  )
}
