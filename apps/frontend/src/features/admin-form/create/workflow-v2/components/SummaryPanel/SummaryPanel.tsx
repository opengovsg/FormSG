import { useCallback, useMemo } from 'react'
import { BiLinkExternal, BiPlayCircle } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Box, Divider, Flex, Icon, Stack, Text } from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { Phase, PhaseStatus } from '../../types'
import {
  fieldsSelector,
  focusStateSelector,
  phaseStatus as getPhaseStatus,
  setFocusSelector,
  stepsSelector,
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
    title: 'Plan your workflow steps',
    description: 'Outline what happens in your workflow, and in what order',
  },
  {
    phase: 'add_respondents',
    title: 'Add people',
    description: 'Choose who fills in each step',
  },
  {
    phase: 'create_fields',
    title: 'Create fields in form builder',
    description: 'Add the fields people will fill in',
  },
  {
    phase: 'assign_fields',
    title: 'Choose fields for each step',
    description: 'Pick which fields belong to each step',
  },
]

export const SummaryPanel = (): JSX.Element => {
  const { formId } = useParams()
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)

  const steps = useWorkflowBuilderStore(stepsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
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

  const subtitles = useMemo((): Partial<Record<Phase, string>> => {
    const stepsWithoutRespondents = steps.filter(
      (s) => s.respondentIds.length === 0,
    ).length
    const stepsWithoutFields = steps.filter(
      (s) => s.fieldIds.length === 0,
    ).length
    const assignedFieldIds = new Set(steps.flatMap((s) => s.fieldIds))
    const unassignedFields = fields.filter(
      (f) => !assignedFieldIds.has(f.id),
    ).length

    return {
      add_respondents:
        stepsWithoutRespondents > 0
          ? `${stepsWithoutRespondents} step${stepsWithoutRespondents === 1 ? '' : 's'} without people`
          : undefined,
      assign_fields:
        stepsWithoutFields > 0
          ? `${stepsWithoutFields} step${stepsWithoutFields === 1 ? ' has' : 's have'} no fields`
          : unassignedFields > 0
            ? `${unassignedFields} field${unassignedFields === 1 ? '' : 's'} unassigned`
            : undefined,
    }
  }, [steps, fields])

  const handlePhaseClick = useCallback(
    (phase: Phase) => {
      if (phase === 'create_fields' && formId) {
        window.open(`/admin/form/${formId}`, '_blank')
        return
      }
      setFocus({ type: 'phase', phase })
    },
    [setFocus, formId],
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
            Set up your workflow
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        <Divider w="auto" mx="-1.5rem" />
      </Box>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Text textStyle="body-2" color="secondary.400" mb="1rem">
          A workflow lets you split your form into steps, so different people
          can fill in or approve different parts.
        </Text>

        {/* Phase cards */}
        <Stack spacing="0.5rem">
          {PHASES.map((config) => (
            <SectionCard
              key={config.phase}
              phase={config.phase}
              title={config.title}
              description={config.description}
              subtitle={subtitles[config.phase]}
              status={phaseStatuses[config.phase]}
              isActive={activePhase === config.phase}
              isFirstIncomplete={firstIncompletePhase === config.phase}
              onClick={() => handlePhaseClick(config.phase)}
            />
          ))}
        </Stack>

        {/* Completion card - below divider, separate from phase cards */}
        {allDone && (
          <>
            <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
            <Box
              as="button"
              type="button"
              w="100%"
              textAlign="start"
              mt="1.5rem"
              p="1rem"
              borderRadius="8px"
              border="2px solid"
              borderColor="#445FCD"
              bg="#F8F9FD"
              cursor="pointer"
              _hover={{ borderColor: 'primary.500' }}
              transition="border-color 0.2s"
              onClick={() => {
                if (formId) {
                  window.open(`/admin/form/${formId}/settings`, '_blank')
                }
              }}
            >
              <Flex align="center" gap="0.75rem">
                <Icon
                  as={BiPlayCircle}
                  fontSize="1.5rem"
                  color="primary.500"
                  flexShrink={0}
                />
                <Box flex={1} minW={0}>
                  <Text textStyle="subhead-1" color="secondary.500">
                    You&rsquo;re all set!
                  </Text>
                  <Text textStyle="body-2" color="secondary.400">
                    Open your form to accept responses before sharing the link
                  </Text>
                </Box>
                <Flex align="center" gap="0.25rem" flexShrink={0}>
                  <Text textStyle="subhead-2" color="primary.500">
                    Go
                  </Text>
                  <Icon
                    as={BiLinkExternal}
                    fontSize="1rem"
                    color="primary.500"
                  />
                </Flex>
              </Flex>
            </Box>
          </>
        )}
      </Box>
    </Flex>
  )
}
