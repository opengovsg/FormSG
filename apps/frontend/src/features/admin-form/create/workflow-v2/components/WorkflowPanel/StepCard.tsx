import { useMemo } from 'react'
import { BiEditAlt } from 'react-icons/bi'
import {
  Box,
  Center,
  Divider,
  Flex,
  HStack,
  Stack,
  Tag,
  TagLabel,
  Text,
  Wrap,
} from '@chakra-ui/react'

import type { WorkflowStep } from '../../types'
import { STEP_COLOURS } from '../../types'
import {
  fieldsSelector,
  focusStateSelector,
  respondentsSelector,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

type StepCardProps = {
  step: WorkflowStep
  stepIndex: number
  colourTheme: string
}

const VISIBLE_FIELD_LIMIT = 3

export const StepCard = ({
  step,
  stepIndex,
  colourTheme,
}: StepCardProps): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)

  const isActive =
    focusState.type === 'step_edit' && focusState.stepId === step.id

  const stepColour = STEP_COLOURS[stepIndex % STEP_COLOURS.length]

  const stepTypeLabel =
    step.type === 'review'
      ? 'Fill up a response and approve'
      : 'Fill up a response'

  const respondentSummary = useMemo(() => {
    if (step.order === 0) return 'Anyone with the form link'
    const stepRespondents = respondents.filter((r) =>
      step.respondentIds.includes(r.id),
    )
    if (stepRespondents.length === 0) return 'None'
    return stepRespondents.map((r) => r.email || r.name).join(', ')
  }, [step.order, step.respondentIds, respondents])

  const assignedFields = useMemo(() => {
    if (step.fieldIds.length === 0) return null
    return fields.filter((f) => step.fieldIds.includes(f.id))
  }, [step.fieldIds, fields])

  const handleClick = () => {
    setFocus({ type: 'step_edit', stepId: step.id })
  }

  return (
    <Box
      data-step-card
      bg="white"
      borderRadius="12px"
      border={isActive ? '2px solid' : '1px solid'}
      borderColor={isActive ? 'primary.500' : 'neutral.300'}
      cursor="pointer"
      onClick={handleClick}
      transition="border-color 0.2s, background 0.2s"
      _hover={
        isActive ? undefined : { borderColor: 'primary.500', bg: 'primary.100' }
      }
    >
      {/* Header */}
      <Flex justify="space-between" align="center" px="1.5rem" py="1rem">
        <HStack spacing="1rem" flex={1} minW={0}>
          <Center
            w="2rem"
            h="2rem"
            borderRadius="full"
            bg={stepColour}
            flexShrink={0}
          >
            <Text
              fontSize="0.75rem"
              fontWeight="700"
              color="white"
              lineHeight="1"
            >
              {stepIndex + 1}
            </Text>
          </Center>

          <Stack spacing="0" flex={1} minW={0}>
            <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
              {step.name}
            </Text>
            <Text textStyle="caption-1" color="secondary.400" noOfLines={1}>
              {stepTypeLabel}
            </Text>
          </Stack>
        </HStack>

        {/* Edit icon - hover reveal */}
        <Box
          p="0.25rem"
          display="flex"
          alignItems="center"
          cursor="pointer"
          opacity={0}
          transition="opacity 0.15s ease"
          sx={{ '[data-step-card]:hover &': { opacity: 1 } }}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
        >
          <BiEditAlt
            fontSize="1.25rem"
            color="var(--chakra-colors-neutral-500)"
          />
        </Box>
      </Flex>

      <Divider borderColor="neutral.300" />

      {/* Body */}
      <Box px="1.5rem" py="1rem">
        {/* People involved */}
        <Stack spacing="0.5rem">
          <Text textStyle="subhead-2" color="secondary.500">
            People involved
          </Text>
          <Wrap spacing="0.25rem">
            <Tag
              size="sm"
              bg="primary.100"
              borderRadius="4px"
              px="0.5rem"
              py="0.25rem"
            >
              <TagLabel textStyle="caption-1" color="secondary.500">
                {respondentSummary}
              </TagLabel>
            </Tag>
          </Wrap>
        </Stack>

        {/* Fields */}
        <Stack spacing="0.5rem" mt="1rem">
          <Text textStyle="subhead-2" color="secondary.500">
            Fields
          </Text>
          {assignedFields && assignedFields.length > 0 ? (
            <Stack spacing="0.125rem">
              {assignedFields.slice(0, VISIBLE_FIELD_LIMIT).map((f) => (
                <Text key={f.id} textStyle="body-2" color="secondary.400">
                  {f.number}. {f.name}
                </Text>
              ))}
              {assignedFields.length > VISIBLE_FIELD_LIMIT && (
                <Text textStyle="body-2" color="secondary.400">
                  +{assignedFields.length - VISIBLE_FIELD_LIMIT} more
                </Text>
              )}
            </Stack>
          ) : (
            <Tag
              size="sm"
              bg="primary.100"
              borderRadius="4px"
              px="0.5rem"
              py="0.25rem"
              w="fit-content"
            >
              <TagLabel textStyle="caption-1" color="secondary.500">
                None
              </TagLabel>
            </Tag>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
