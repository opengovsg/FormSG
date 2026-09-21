import { useEffect, useRef } from 'react'
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

import {
  guidedWrapUpSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'
import { useIsWorkflowGuidedMode } from '../../hooks/useIsWorkflowGuidedMode'
import { useWorkflowSurfaces } from '../../hooks/useWorkflowSurfaces'
import { GuidedWrapUp } from '../../types'
import { DeleteWorkflowModal } from '../DeleteWorkflowModal'
import {
  GuidedSetupFinishedPeekCard,
  GuidedSetupToggle,
  useReportedCompletedStep,
} from '../GuidedCreation'
import { Spotlight } from '../Spotlight'
import { CompletionEmailBlock } from './CompletionEmailBlock'
import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

export const STEP_CONNECTOR_TEST_ID = 'workflow-step-connector'

const WORKFLOW_CARD_PADDING = '1.5rem'

export const WorkflowContent = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { formWorkflow, isLoading } = useAdminFormWorkflow()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isGuidedMode = useIsWorkflowGuidedMode()
  const guidedWrapUp = useAdminWorkflowStore(guidedWrapUpSelector)
  const isOnStatusTracking =
    isGuidedMode && guidedWrapUp === GuidedWrapUp.StatusTracking
  const showStatusTracker =
    !isGuidedMode ||
    guidedWrapUp === GuidedWrapUp.StatusTracking ||
    guidedWrapUp === GuidedWrapUp.Done
  const workflowCardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOnStatusTracking) return
    workflowCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [isOnStatusTracking])
  const { cardRadius, iconRestColor } = useWorkflowSurfaces()
  const isReportingCompletedStep = useReportedCompletedStep() !== null
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
      <Stack spacing="0">
        <Box
          ref={workflowCardRef}
          bg="white"
          border="1px solid"
          borderColor="neutral.300"
          borderRadius={cardRadius}
          padding={WORKFLOW_CARD_PADDING}
          pos="relative"
          zIndex={1}
        >
          <Stack gap={'1.5rem'}>
            <Flex align="center" justify="space-between">
              <Text as="h2" textStyle="h2">
                Workflow
              </Text>
              {isRedesign ? (
                <IconButton
                  variant="clear"
                  colorScheme="danger"
                  color={iconRestColor}
                  transitionProperty="common"
                  transitionDuration="normal"
                  _hover={{ color: 'danger.500', bg: 'danger.100' }}
                  _active={{ color: 'danger.500', bg: 'danger.200' }}
                  aria-label={t(
                    'features.adminForm.sidebar.workflow.aria.deleteWorkflow',
                  )}
                  icon={<BiTrash />}
                  onClick={onDeleteModalOpen}
                />
              ) : null}
            </Flex>
            <Divider />
            <GuidedSetupToggle />
            {showStatusTracker ? (
              <Box mx={`-${WORKFLOW_CARD_PADDING}`}>
                <Spotlight isActive isEnabled={isOnStatusTracking}>
                  <Box px={WORKFLOW_CARD_PADDING}>
                    <StatusTrackerToggle />
                  </Box>
                </Spotlight>
              </Box>
            ) : null}
          </Stack>
        </Box>
        <GuidedSetupFinishedPeekCard />
      </Stack>
      <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
        {formWorkflow?.map((step, i) => (
          <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
        ))}
        {isReportingCompletedStep ? null : <NewStepBlock />}
      </Stack>
      {formWorkflow?.length ? (
        isRedesign ? (
          <CompletionEmailBlock />
        ) : (
          <WorkflowCompletionMessageBlock />
        )
      ) : null}
    </Stack>
  )
}

const WorkflowStepBlockDivider = () => (
  <Box
    data-testid={STEP_CONNECTOR_TEST_ID}
    alignSelf="center"
    justifyContent="center"
    border="none"
  >
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
