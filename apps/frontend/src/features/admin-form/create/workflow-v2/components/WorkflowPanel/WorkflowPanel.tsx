import { useCallback } from 'react'
import { BiChevronDown, BiPlus } from 'react-icons/bi'
import { Box, Center, Flex, Icon, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import { getStepColourThemes } from '../../types'
import {
  focusStateSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { EndWorkflowCard } from './EndWorkflowCard'
import { StepCard } from './StepCard'
import { StepDetailPanel } from './StepDetailPanel'

const colourThemes = getStepColourThemes()

/**
 * Connection line between step cards.
 * Matches CanvasDecorations.tsx: 2px line + chevron + 2px line.
 */
const ConnectionLine = (): JSX.Element => (
  <Flex direction="column" align="center" pt="2px">
    <Box w="2px" h="1rem" bg="secondary.200" />
    <Center w="1rem" h="1rem" bg="primary.100">
      <Icon as={BiChevronDown} fontSize="1rem" color="secondary.300" />
    </Center>
    <Box w="2px" h="1rem" bg="secondary.200" />
  </Flex>
)

/**
 * Add step button circle on the connector.
 * Matches CanvasDecorations.tsx AddStepConnector: 3rem dashed circle.
 */
const AddStepButton = ({ onClick }: { onClick: () => void }): JSX.Element => (
  <Flex direction="column" align="center">
    <Center
      as="button"
      w="3rem"
      h="3rem"
      borderRadius="full"
      border="1px dashed"
      borderColor="primary.500"
      bg="white"
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: 'primary.100' }}
      transition="background 0.2s"
    >
      <Icon as={BiPlus} fontSize="1.5rem" color="primary.500" />
    </Center>
  </Flex>
)

/**
 * "END OF WORKFLOW" text divider.
 * Matches CanvasDecorations.tsx WorkflowEndDivider.
 */
const EndDivider = (): JSX.Element => (
  <Flex align="center" gap="1.5rem" py="2rem">
    <Box flex={1} h="1px" bg="secondary.200" />
    <Text
      textStyle="subhead-3"
      color="secondary.500"
      whiteSpace="nowrap"
      flexShrink={0}
    >
      END OF WORKFLOW
    </Text>
    <Box flex={1} h="1px" bg="secondary.200" />
  </Flex>
)

export const WorkflowPanel = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const addStep = useWorkflowBuilderStore((s) => s.addStep)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const createWorkflow = useWorkflowBuilderStore((s) => s.createWorkflow)

  const handleAddStepAt = useCallback(
    (insertIndex: number) => {
      const name = `Step ${insertIndex + 1}`
      addStep('collect', name, insertIndex)
      setTimeout(() => {
        const currentSteps = useWorkflowBuilderStore.getState().steps
        const newStep = currentSteps[insertIndex]
        if (newStep) {
          setFocus({ type: 'step_edit', stepId: newStep.id })
        }
      }, 0)
    },
    [addStep, setFocus],
  )

  // Step edit mode: render detail panel instead of the step list
  if (focusState.type === 'step_edit') {
    const editIndex = steps.findIndex((s) => s.id === focusState.stepId)
    const editStep = steps[editIndex]

    if (editStep) {
      const theme = colourThemes[editIndex % colourThemes.length]
      return (
        <Flex w="100%" h="100%" flexDir="column" bg="white">
          <StepDetailPanel
            step={editStep}
            stepIndex={editIndex}
            colourTheme={theme}
          />
        </Flex>
      )
    }
  }

  // Empty workflow state
  if (steps.length === 0) {
    return (
      <Flex w="100%" h="100%" flexDir="column" bg="white">
        {/* Drawer header */}
        <Flex
          justify="space-between"
          align="center"
          px="1.5rem"
          py="1rem"
          borderBottom="1px solid"
          borderColor="neutral.300"
          pos="sticky"
          top={0}
          bg="white"
          zIndex={1}
        >
          <Text textStyle="subhead-3" color="secondary.500">
            WORKFLOW
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>

        {/* Center-aligned empty state */}
        <Flex
          flex={1}
          flexDir="column"
          align="center"
          justify="center"
          px="2rem"
          textAlign="center"
        >
          {/* Simple workflow illustration: 3 connected step circles */}
          <Box mb="1.5rem">
            <svg
              width="120"
              height="48"
              viewBox="0 0 120 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Step circles */}
              <circle cx="24" cy="24" r="16" fill="#E4E7F6" />
              <circle cx="60" cy="24" r="16" fill="#D0D5ED" />
              <circle cx="96" cy="24" r="16" fill="#B7C0E6" />
              {/* Numbers */}
              <text
                x="24"
                y="28"
                textAnchor="middle"
                fill="#4A61C0"
                fontSize="12"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                1
              </text>
              <text
                x="60"
                y="28"
                textAnchor="middle"
                fill="#4A61C0"
                fontSize="12"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                2
              </text>
              <text
                x="96"
                y="28"
                textAnchor="middle"
                fill="#4A61C0"
                fontSize="12"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                3
              </text>
              {/* Connecting arrows */}
              <path
                d="M40 24h4l-2-3v6l2-3"
                stroke="#8998D6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M76 24h4l-2-3v6l2-3"
                stroke="#8998D6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
          <Text textStyle="h2" color="secondary.500" mb="0.5rem">
            Create a workflow to collect responses from multiple people in the
            same form submission
          </Text>
          <Text textStyle="body-1" color="secondary.400" mb="1.5rem">
            Assign people to specific steps and control which fields they can
            fill.
          </Text>
          <Button
            colorScheme="primary"
            leftIcon={<BiPlus fontSize="1.5rem" />}
            onClick={createWorkflow}
          >
            Create workflow
          </Button>
        </Flex>
      </Flex>
    )
  }

  // Has workflow state
  return (
    <Flex w="100%" h="100%" flexDir="column" bg="white">
      {/* Drawer header */}
      <Flex
        justify="space-between"
        align="center"
        px="1.5rem"
        py="1rem"
        borderBottom="1px solid"
        borderColor="neutral.300"
        pos="sticky"
        top={0}
        bg="white"
        zIndex={1}
      >
        <Text textStyle="subhead-3" color="secondary.500">
          WORKFLOW
        </Text>
        <CreatePageDrawerCloseButton />
      </Flex>

      {/* Scrollable step list */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        {steps.map((step, index) => {
          const theme = colourThemes[index % colourThemes.length]
          return (
            <Box key={step.id}>
              {/* Connection line before this card (except first) */}
              {index > 0 && <ConnectionLine />}
              <StepCard step={step} stepIndex={index} colourTheme={theme} />
            </Box>
          )
        })}

        {/* Connection line + add button after last card */}
        <ConnectionLine />
        <AddStepButton onClick={() => handleAddStepAt(steps.length)} />

        {/* End of workflow divider */}
        <EndDivider />

        {/* End workflow notification card */}
        <EndWorkflowCard />
      </Box>
    </Flex>
  )
}
