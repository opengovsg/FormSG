import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  ThemingProps,
  useBreakpointValue,
  Wrap,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { DropdownMenuLayerProvider } from '~components/Dropdown'
import { ModalCloseButton } from '~components/Modal'

import { formatEmailList } from './formatEmailList'
import { WORKFLOW_STOP_I18N } from './i18n'

interface WorkflowActionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  isBeta?: boolean
  /** Inputs between the description and "Who will be notified". */
  children?: ReactNode
  notifiedEmails: string[]
  confirmLabel: string
  confirmColorScheme?: ThemingProps['colorScheme']
  isConfirmDisabled?: boolean
  onConfirm: () => void
}

/** Shared shell for the Remind, Reassign and Stop modals. */
export const WorkflowActionModal = ({
  isOpen,
  onClose,
  title,
  description,
  isBeta,
  children,
  notifiedEmails,
  confirmLabel,
  confirmColorScheme,
  isConfirmDisabled,
  onConfirm,
}: WorkflowActionModalProps): JSX.Element => {
  const { t } = useTranslation()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700" pr="4.5rem">
          <Wrap shouldWrapChildren direction="row" align="center">
            <Text>{title}</Text>
            {isBeta ? (
              <Badge
                w="fit-content"
                colorScheme="primary"
                variant="subtle"
                color="secondary.500"
              >
                {t('features.common.betaBadgeLabel')}
              </Badge>
            ) : null}
          </Wrap>
        </ModalHeader>
        <ModalBody>
          {/* Raise dropdown menus (portalled to body) above this modal. */}
          <DropdownMenuLayerProvider value="popover">
            <Stack spacing="1.5rem">
              <Text textStyle="body-2" color="secondary.500">
                {description}
              </Text>
              {children ? (
                <>
                  <Divider />
                  {children}
                </>
              ) : null}
              <Divider />
              <Stack spacing="0.25rem">
                <Text textStyle="subhead-2" color="secondary.700">
                  {t(`${WORKFLOW_STOP_I18N}.whoIsNotifiedLabel`)}
                </Text>
                <Text textStyle="body-2" color="secondary.500">
                  {notifiedEmails.length > 0
                    ? formatEmailList(notifiedEmails)
                    : t(`${WORKFLOW_STOP_I18N}.whoIsNotifiedNone`)}
                </Text>
              </Stack>
            </Stack>
          </DropdownMenuLayerProvider>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {t('features.common.cancel')}
            </Button>
            <Button
              colorScheme={confirmColorScheme}
              isDisabled={isConfirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
