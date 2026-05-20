import { useCallback } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Stack,
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

/**
 * Simplified panel shown when "+" is clicked to focus on a specific insert position.
 * Clicking a step type opens the naming form with the insert index pre-set.
 */
export const FocusedInsertPanel = (): JSX.Element => {
  const steps = useWorkflowBuilderStore(stepsSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const pendingInsertIndex = useWorkflowBuilderStore(pendingInsertIndexSelector)
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )

  const insertIndex = pendingInsertIndex ?? steps.length

  const handleBack = useCallback(() => {
    setPendingInsertIndex(null)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [setFocus, setPendingInsertIndex])

  const handleDone = useCallback(() => {
    setPendingInsertIndex(null)
    setFocus({ type: 'summary' })
  }, [setFocus, setPendingInsertIndex])

  const handleStepTypeClick = useCallback(
    (stepType: StepType) => {
      setPendingInsertIndex(null)
      setFocus({
        type: 'step_naming',
        stepType,
        insertIndex,
      })
    },
    [insertIndex, setFocus, setPendingInsertIndex],
  )

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
      {/* Header */}
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
          aria-label="Back"
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
          Add a step
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Text textStyle="body-2" color="secondary.400" mb="1.5rem">
          Click on a step or drag it into the workflow.
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

        {/* CTA - flows after content */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button colorScheme="primary" onClick={handleDone}>
            Done
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
