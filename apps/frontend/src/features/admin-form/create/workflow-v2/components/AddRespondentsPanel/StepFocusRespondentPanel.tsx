import { useCallback, useMemo } from 'react'
import { BiLeftArrowAlt, BiPlus, BiUser } from 'react-icons/bi'
import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  focusStateSelector,
  respondentsSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { RespondentCard } from './RespondentCard'

export const StepFocusRespondentPanel = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const assignRespondent = useWorkflowBuilderStore((s) => s.assignRespondent)
  const unassignRespondent = useWorkflowBuilderStore(
    (s) => s.unassignRespondent,
  )

  const stepId = focusState.type === 'step_focus' ? focusState.stepId : ''
  const step = useMemo(
    () => steps.find((s) => s.id === stepId),
    [steps, stepId],
  )

  // Exclude form_link respondent from step-focus checkbox list
  const assignableRespondents = useMemo(
    () => respondents.filter((r) => r.type !== 'form_link'),
    [respondents],
  )

  const handleBack = useCallback(() => {
    if (focusState.type === 'step_focus' && focusState.fromStepEdit) {
      setFocus({ type: 'step_edit', stepId, fromSummary: true })
    } else {
      setFocus({ type: 'phase', phase: 'add_respondents' })
    }
  }, [setFocus, focusState, stepId])

  const handleAddNewRespondent = useCallback(() => {
    setFocus({ type: 'new_respondent', fromStepId: stepId })
  }, [setFocus, stepId])

  const handleToggle = useCallback(
    (respondentId: string) => {
      if (!step) return
      if (step.respondentIds.includes(respondentId)) {
        unassignRespondent(stepId, respondentId)
      } else {
        assignRespondent(stepId, respondentId)
      }
    },
    [step, stepId, assignRespondent, unassignRespondent],
  )

  if (!step) return <Box />

  const isFirstStep = step.order === 0

  // Truncate step name for header
  const truncatedName =
    step.name.length > 25 ? `${step.name.slice(0, 25)}...` : step.name

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
          aria-label="Back to pool"
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
          noOfLines={1}
        >
          {isFirstStep
            ? step.name
            : `Select people for \u201C${truncatedName}\u201D`}
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        {isFirstStep ? (
          <>
            {/* Step 1 — not configurable */}
            <Flex
              direction="column"
              align="center"
              pt="2rem"
              pb="1rem"
              gap="0.5rem"
            >
              <Icon
                as={BiUser}
                fontSize="2rem"
                color="secondary.300"
                mb="0.25rem"
              />
              <Text
                textStyle="subhead-1"
                color="secondary.500"
                textAlign="center"
              >
                This is the first step
              </Text>
              <Text
                textStyle="body-2"
                color="secondary.400"
                textAlign="center"
                maxW="22rem"
              >
                Anyone who receives the form link can fill it in
              </Text>
            </Flex>

            {/* CTA */}
            <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
            <Flex justify="flex-end" py="1rem">
              <Button
                variant="outline"
                colorScheme="primary"
                onClick={handleBack}
              >
                Done with this step
              </Button>
            </Flex>
          </>
        ) : (
          <>
            {/* Respondent cards with checkboxes */}
            <Stack spacing="0.5rem">
              {assignableRespondents.map((r) => (
                <RespondentCard
                  key={r.id}
                  respondent={r}
                  showCheckbox
                  isChecked={step.respondentIds.includes(r.id)}
                  onToggle={() => handleToggle(r.id)}
                />
              ))}
            </Stack>

            {/* Add new respondent */}
            <Button
              variant="clear"
              colorScheme="primary"
              leftIcon={<Icon as={BiPlus} fontSize="1.25rem" />}
              mt="0.5rem"
              onClick={handleAddNewRespondent}
            >
              Add a new person
            </Button>

            {/* CTA */}
            <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
            <Flex justify="flex-end" py="1rem">
              <Button
                variant="outline"
                colorScheme="primary"
                onClick={handleBack}
              >
                Done with this step
              </Button>
            </Flex>
          </>
        )}
      </Box>
    </Flex>
  )
}
