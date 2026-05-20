import { useCallback, useMemo } from 'react'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { Phase, PhaseStatus } from '../../types'
import {
  focusStateSelector,
  phaseStatus as getPhaseStatus,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { SectionCard } from './SectionCard'

type PhaseConfig = {
  phase: Phase
  title: string
  description: string
}

const PHASES: PhaseConfig[] = [
  {
    phase: 'add_steps',
    title: 'Add steps',
    description: 'Plan out what will be done at each step of your workflow',
  },
  {
    phase: 'add_respondents',
    title: 'Add respondents',
    description: 'Choose who fills in each step',
  },
  {
    phase: 'create_fields',
    title: 'Create fields in form builder',
    description: 'Add the fields respondents will fill in',
  },
  {
    phase: 'assign_fields',
    title: 'Assign fields',
    description: 'Assign fields to each step',
  },
]

export const SummaryPanel = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)

  const storeState = useWorkflowBuilderStore((state) => state)

  const phaseStatuses = useMemo((): Record<Phase, PhaseStatus> => {
    return {
      add_steps: getPhaseStatus(storeState, 'add_steps'),
      add_respondents: getPhaseStatus(storeState, 'add_respondents'),
      create_fields: getPhaseStatus(storeState, 'create_fields'),
      assign_fields: getPhaseStatus(storeState, 'assign_fields'),
    }
  }, [storeState])

  const firstIncompletePhase = useMemo(() => {
    return PHASES.find((p) => phaseStatuses[p.phase] !== 'done')?.phase ?? null
  }, [phaseStatuses])

  // Active phase: either explicitly selected, or the first incomplete phase
  const activePhase = useMemo(() => {
    if (focusState.type === 'phase') return focusState.phase
    if (focusState.type === 'summary') return firstIncompletePhase
    return null
  }, [focusState, firstIncompletePhase])

  const handlePhaseClick = useCallback(
    (phase: Phase) => {
      setFocus({ type: 'phase', phase })
    },
    [setFocus],
  )

  const allDone = useMemo(
    () => Object.values(phaseStatuses).every((s) => s === 'done'),
    [phaseStatuses],
  )

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
      {/* Header - matches DesignDrawer pattern */}
      <Box pt="1rem" px="1.5rem">
        <Flex justify="space-between" align="center" mb="0.75rem">
          <Text textStyle="subhead-3" color="secondary.500">
            WORKFLOW BUILDER
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        <Divider w="auto" mx="-1.5rem" />
      </Box>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        {/* Description */}
        <Text textStyle="subhead-1" color="secondary.700" mb="0.25rem">
          Set up your workflow
        </Text>
        <Text textStyle="body-2" color="secondary.400" mb="1.5rem">
          A workflow lets you split your form into steps, so different people
          can fill in or approve different parts.
        </Text>

        {/* Phase cards */}
        <Stack spacing="0.75rem">
          {PHASES.map((config) => (
            <SectionCard
              key={config.phase}
              phase={config.phase}
              title={config.title}
              description={config.description}
              status={phaseStatuses[config.phase]}
              isActive={activePhase === config.phase}
              isFirstIncomplete={firstIncompletePhase === config.phase}
              onClick={() => handlePhaseClick(config.phase)}
            />
          ))}
        </Stack>

        {/* Completion message */}
        {allDone && (
          <Box mt="1.5rem" p="1rem" borderRadius="8px" bg="success.100">
            <Text textStyle="body-1" color="success.700">
              You're all set! Open your form to accept responses before sharing
              the link.
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  )
}
