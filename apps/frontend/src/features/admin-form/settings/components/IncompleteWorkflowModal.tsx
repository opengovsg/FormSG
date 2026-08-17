import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UnorderedList,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { OPEN_WORKFLOW_TAB_STATE } from '~features/admin-form/create/common/OpenWorkflowTabOnArrival'

export interface IncompleteWorkflowModalProps extends Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> {
  formId: string
  /** Names of the unfinished steps, in step order. */
  incompleteStepLabels: string[]
}

/**
 * Shown when an admin tries to open a form whose workflow is not finished.
 * Names the steps rather than explaining what's missing (FRM-2489).
 */
export const IncompleteWorkflowModal = ({
  isOpen,
  onClose,
  formId,
  incompleteStepLabels,
}: IncompleteWorkflowModalProps): JSX.Element => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const { title, description, confirm, cancel } = t(
    'features.adminForm.settings.general.status.incompleteWorkflowModal',
    { returnObjects: true },
  )

  const handleGoToWorkflow = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}`, {
      state: OPEN_WORKFLOW_TAB_STATE,
    })
  }, [formId, navigate])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">{title}</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text textStyle="body-2" color="secondary.500">
            {description}
          </Text>
          <UnorderedList
            textStyle="body-2"
            color="secondary.500"
            mt="0.5rem"
            ml="1.5rem"
          >
            {incompleteStepLabels.map((label) => (
              <ListItem key={label}>{label}</ListItem>
            ))}
          </UnorderedList>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {cancel}
            </Button>
            <Button onClick={handleGoToWorkflow}>{confirm}</Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
