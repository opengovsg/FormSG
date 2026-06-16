import {
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { BxsCheckCircle } from '~assets/icons'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { getWorkflowCompletionStatus } from '../../utils/getWorkflowCompletionStatus'

interface WorkflowSuccessModalProps {
  isOpen: boolean
  onDone: () => void
}

function getSuccessCopy(doneCount: number, leftCount: number) {
  if (leftCount === 0) {
    return {
      heading: "You've built your workflow!",
      subheading: 'You can still edit it again later.',
    }
  }
  if (doneCount > leftCount) {
    return {
      heading: "You've built your workflow!",
      subheading: 'You can finish up the rest of the details later.',
    }
  }
  return {
    heading: "You've got a good start to your workflow!",
    subheading: 'You can add in the rest of the details later.',
  }
}

export const WorkflowSuccessModal = ({
  isOpen,
  onDone,
}: WorkflowSuccessModalProps): JSX.Element => {
  const { formWorkflow } = useAdminFormWorkflow()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const status = getWorkflowCompletionStatus(formWorkflow ?? [])
  const { heading, subheading } = getSuccessCopy(
    status.done.length,
    status.left.length,
  )

  return (
    <Modal isOpen={isOpen} onClose={onDone} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody pt="2rem" pb="0">
          <Stack spacing="0.5rem" alignItems="center" textAlign="center">
            <Icon as={BxsCheckCircle} color="success.500" fontSize="3rem" />
            <Text textStyle="h2" color="secondary.700">
              {heading}
            </Text>
            <Text textStyle="body-1" color="secondary.400">
              {subheading}
            </Text>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onDone}>Done</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
