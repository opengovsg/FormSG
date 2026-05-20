import { useCallback } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { StepType } from '../../types'
import {
  pendingInsertIndexSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { StepTypeCard } from './StepTypeCard'

export const AddStepsPanel = (): JSX.Element => {
  const steps = useWorkflowBuilderStore(stepsSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const pendingInsertIndex = useWorkflowBuilderStore(pendingInsertIndexSelector)
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )
  const toggleStatusTracking = useWorkflowBuilderStore(
    (s) => s.toggleStatusTracking,
  )
  const statusTrackingEnabled = useWorkflowBuilderStore(
    (s) => s.statusTrackingEnabled,
  )

  const hasMultipleSteps = steps.length > 1

  const handleBack = useCallback(() => {
    setPendingInsertIndex(null)
    setFocus({ type: 'summary' })
  }, [setFocus, setPendingInsertIndex])

  const handleStepTypeClick = useCallback(
    (stepType: StepType) => {
      const insertIndex = pendingInsertIndex ?? steps.length
      setPendingInsertIndex(null)
      setFocus({
        type: 'step_naming',
        stepType,
        insertIndex,
      })
    },
    [setFocus, setPendingInsertIndex, pendingInsertIndex, steps.length],
  )

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
      {/* Header - matches BuilderDrawerContainer pattern */}
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid"
        borderColor="neutral.300"
        bg="white"
        zIndex={1}
      >
        <IconButton
          aria-label="Back to summary"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="clear"
          colorScheme="secondary"
          size="sm"
          h="1.5rem"
          w="1.5rem"
          onClick={handleBack}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          {hasMultipleSteps ? 'Add steps' : 'Add a step'}
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Text textStyle="body-2" color="secondary.400" mb="1.5rem">
          {hasMultipleSteps
            ? 'Need multiple people to fill in or approve this form? Add more steps.'
            : 'Click on a step or drag it into the workflow.'}
        </Text>

        <Stack spacing="0.75rem">
          <StepTypeCard
            stepType="collect"
            onClick={() => handleStepTypeClick('collect')}
          />
          <StepTypeCard
            stepType="review"
            onClick={() => handleStepTypeClick('review')}
          />
        </Stack>

        {/* Status tracking toggle - only when 2+ steps */}
        {hasMultipleSteps && (
          <Flex
            mt="1.5rem"
            mx="-1.5rem"
            px="1.5rem"
            pt="1.5rem"
            borderTop="1px solid"
            borderColor="neutral.300"
            justify="space-between"
            align="flex-start"
          >
            <Box>
              <Text textStyle="subhead-1" color="secondary.500">
                Allow respondents to track their workflow status
              </Text>
              <Text textStyle="caption-1" color="primary.500">
                View a sample status tracking link here
              </Text>
            </Box>
            <Switch
              isChecked={statusTrackingEnabled}
              onChange={toggleStatusTracking}
              colorScheme="primary"
              flexShrink={0}
              mt="0.125rem"
            />
          </Flex>
        )}

        {/* CTA - flows after content */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button colorScheme="primary" onClick={handleBack}>
            {hasMultipleSteps ? 'Done adding steps' : 'Done'}
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
