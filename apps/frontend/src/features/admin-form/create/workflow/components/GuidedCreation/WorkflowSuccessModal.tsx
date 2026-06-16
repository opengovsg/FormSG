import {
  Box,
  Flex,
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
import {
  CompletionItem,
  getWorkflowCompletionStatus,
} from '../../utils/getWorkflowCompletionStatus'

interface WorkflowSuccessModalProps {
  isOpen: boolean
  onDone: () => void
}

const DoneItem = ({ item }: { item: CompletionItem }) => (
  <Flex gap="0.5rem" alignItems="center">
    <Icon
      as={BxsCheckCircle}
      color="success.500"
      fontSize="1rem"
      flexShrink={0}
    />
    <Text textStyle="body-2" color="secondary.500">
      {item.label}
    </Text>
  </Flex>
)

const LeftItem = ({ item }: { item: CompletionItem }) => (
  <Flex gap="0.5rem" alignItems="center">
    <Box
      w="1rem"
      h="1rem"
      borderRadius="full"
      border="2px solid"
      borderColor="warning.500"
      flexShrink={0}
    />
    <Text textStyle="body-2" color="secondary.400">
      {item.label}
    </Text>
  </Flex>
)

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

  return (
    <Modal isOpen={isOpen} onClose={onDone} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody pt="2rem" pb="0">
          <Stack spacing="1rem" alignItems="center" textAlign="center">
            <Icon as={BxsCheckCircle} color="success.500" fontSize="3rem" />
            <Text textStyle="h2" color="secondary.700">
              You&apos;ve built your workflow!
            </Text>
          </Stack>

          <Stack spacing="0.75rem" mt="1rem">
            <Box>
              <Text
                textStyle="caption-1"
                color="success.700"
                mb="0.375rem"
                fontWeight={500}
              >
                What&apos;s done
              </Text>
              <Box bg="success.100" borderRadius="4px" p="0.75rem">
                <Stack spacing="0.5rem">
                  {status.done.map((item, i) => (
                    <DoneItem key={i} item={item} />
                  ))}
                </Stack>
              </Box>
            </Box>

            {status.left.length > 0 && (
              <Box>
                <Text
                  textStyle="caption-1"
                  color="warning.600"
                  mb="0.375rem"
                  fontWeight={500}
                >
                  Still to do
                </Text>
                <Box bg="warning.100" borderRadius="4px" p="0.75rem">
                  <Stack spacing="0.5rem">
                    {status.left.map((item, i) => (
                      <LeftItem key={i} item={item} />
                    ))}
                  </Stack>
                </Box>
              </Box>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onDone}>Done</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
