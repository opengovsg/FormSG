import { useTranslation } from 'react-i18next'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  Divider,
  Flex,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import IconButton from '~components/IconButton'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useIsWorkflowDeletion } from '../../hooks/useIsWorkflowDeletion'
import { DeleteWorkflowModal } from '../DeleteWorkflowModal'

import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

export const WorkflowContent = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { formWorkflow, isLoading } = useAdminFormWorkflow()
  const isWorkflowDeletion = useIsWorkflowDeletion()
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  if (isLoading) return null
  return (
    <Stack color="secondary.500" spacing="2.75rem" mt="1.5rem">
      <DeleteWorkflowModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        entryPoint="workflow-card"
      />
      {/* <HeaderBlock /> */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        borderRadius="4px"
        padding="1.5rem"
      >
        <Stack gap={'1.5rem'}>
          <Flex align="center" justify="space-between">
            <Text as="h2" textStyle="h2">
              Workflow
            </Text>
            {/* Grey rather than danger-red. This sits on the card at rest,
                not inside a confirmation, and a red button in the corner of a
                page reads as a warning about the page's state rather than as
                an action. The destructive colour belongs on the button that
                actually destroys something, in the modal. */}
            {isWorkflowDeletion ? (
              <IconButton
                variant="clear"
                colorScheme="secondary"
                aria-label={t(
                  'features.adminForm.sidebar.workflow.aria.deleteWorkflow',
                )}
                icon={<BiTrash />}
                onClick={onDeleteModalOpen}
              />
            ) : null}
          </Flex>
          <Divider />
          <StatusTrackerToggle />
        </Stack>
      </Box>
      <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
        {formWorkflow?.map((step, i) => (
          <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
        ))}
        <NewStepBlock />
      </Stack>
      {formWorkflow?.length ? <WorkflowCompletionMessageBlock /> : null}
    </Stack>
  )
}

const WorkflowStepBlockDivider = () => (
  <Box alignSelf="center" justifyContent="center" border="none">
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
    <BxsChevronDown />
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
  </Box>
)
