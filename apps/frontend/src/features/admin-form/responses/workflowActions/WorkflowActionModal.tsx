import { ReactNode, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Divider,
  Flex,
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

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionFocusContext } from './WorkflowActionFocusContext'

export interface WorkflowActionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  isBeta?: boolean
  children?: ReactNode
  notifiedEmails?: string[]
  confirmLabel: string
  confirmColorScheme?: ThemingProps['colorScheme']
  isConfirmDisabled?: boolean
  isConfirmLoading?: boolean
  onConfirm: () => void
}

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
  isConfirmLoading,
  onConfirm,
}: WorkflowActionModalProps): JSX.Element => {
  const restoreActionFocus = useContext(WorkflowActionFocusContext)
  const finalFocusRef = useMemo(
    () =>
      restoreActionFocus
        ? { current: { focus: restoreActionFocus } }
        : undefined,
    [restoreActionFocus],
  )
  const { t } = useTranslation()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      returnFocusOnClose
      finalFocusRef={finalFocusRef}
      onCloseComplete={restoreActionFocus}
    >
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
          <DropdownMenuLayerProvider value="popover">
            <Stack spacing="1.5rem">
              {description ? (
                <Text textStyle="body-2" color="secondary.500">
                  {description}
                </Text>
              ) : null}
              {children ? (
                <>
                  {description ? <Divider /> : null}
                  {children}
                </>
              ) : null}
              {notifiedEmails ? (
                <>
                  <Divider />
                  <Stack spacing="0.25rem">
                    <Text textStyle="subhead-2" color="secondary.700">
                      {t(`${WORKFLOW_ACTIONS_I18N}.whoIsNotifiedLabel`)}
                    </Text>
                    {notifiedEmails.length > 0 ? (
                      <Flex flexWrap="wrap" gap="0.5rem">
                        {notifiedEmails.map((email) => (
                          <LogicBadge key={email} overflowWrap="anywhere">
                            {email}
                          </LogicBadge>
                        ))}
                      </Flex>
                    ) : (
                      <Text textStyle="body-2" color="secondary.500">
                        {t(`${WORKFLOW_ACTIONS_I18N}.whoIsNotifiedNone`)}
                      </Text>
                    )}
                  </Stack>
                </>
              ) : null}
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
              isLoading={isConfirmLoading}
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
