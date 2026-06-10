import { useCallback, useMemo, useState } from 'react'
import {
  BiChevronDown,
  BiEnvelope,
  BiLeftArrowAlt,
  BiTrash,
  BiX,
} from 'react-icons/bi'
import {
  Box,
  Checkbox,
  Divider,
  Flex,
  Icon,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from '@chakra-ui/react'

import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'
import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { StepType, WorkflowStep } from '../../types'
import {
  fieldsSelector,
  respondentsSelector,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

type StepDetailPanelProps = {
  step: WorkflowStep
  stepIndex: number
  colourTheme: string
}

// Mock select dropdown (display only)
const MockSelect = ({ placeholder }: { placeholder: string }): JSX.Element => (
  <Flex
    border="1px solid"
    borderColor="neutral.400"
    borderRadius="4px"
    px="1rem"
    h="2.75rem"
    align="center"
    justify="space-between"
    bg="white"
    mt="0.5rem"
    ml="1.75rem"
  >
    <Text textStyle="body-1" color="neutral.500">
      {placeholder}
    </Text>
    <Icon as={BiChevronDown} fontSize="1.25rem" color="secondary.400" />
  </Flex>
)

// Mock email tag input (display only)
const MockEmailTags = ({ emails }: { emails: string[] }): JSX.Element => (
  <Flex
    border="1px solid"
    borderColor="neutral.400"
    borderRadius="4px"
    px="0.5rem"
    py="0.375rem"
    wrap="wrap"
    gap="0.25rem"
    bg="white"
    mt="0.5rem"
    ml="1.75rem"
    minH="2.75rem"
    align="center"
  >
    {emails.map((email) => (
      <Flex
        key={email}
        bg="primary.100"
        borderRadius="4px"
        px="0.5rem"
        py="0.25rem"
        align="center"
        gap="0.25rem"
      >
        <Text textStyle="body-2" color="primary.500">
          {email}
        </Text>
        <Icon
          as={BiX}
          fontSize="0.75rem"
          color="primary.500"
          cursor="pointer"
        />
      </Flex>
    ))}
  </Flex>
)

export const StepDetailPanel = ({
  step,
  stepIndex,
  colourTheme,
}: StepDetailPanelProps): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const setStepType = useWorkflowBuilderStore((s) => s.setStepType)
  const toggleFieldAssignment = useWorkflowBuilderStore(
    (s) => s.toggleFieldAssignment,
  )
  const renameStep = useWorkflowBuilderStore((s) => s.renameStep)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)

  const [editName, setEditName] = useState(step.name)

  const colorTheme = useDesignColorTheme()
  const checkboxColorScheme = colorTheme ? `theme-${colorTheme}` : 'theme-blue'

  const assignedCount = step.fieldIds.length
  const totalCount = fields.length

  const stepRespondents = useMemo(() => {
    return respondents.filter((r) => step.respondentIds.includes(r.id))
  }, [respondents, step.respondentIds])

  const currentRespondentType = useMemo(() => {
    if (step.order === 0) return 'form_link'
    if (stepRespondents.length > 0) return stepRespondents[0].type
    return 'email_field'
  }, [step.order, stepRespondents])

  const handleBack = useCallback(() => {
    setFocus({ type: 'default' })
  }, [setFocus])

  const handleNameBlur = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== step.name) {
      renameStep(step.id, trimmed)
    } else {
      setEditName(step.name)
    }
  }, [editName, step.name, step.id, renameStep])

  return (
    <Flex h="100%" flexDir="column">
      {/* Sticky header - matches field editor pattern */}
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
          noOfLines={1}
        >
          Edit &ldquo;{step.name}&rdquo;
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content area */}
      <Box flex={1} overflow="auto">
        {/* Section: Step type */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
            Step type
          </Text>
          <RadioGroup
            value={step.type}
            onChange={(val) => setStepType(step.id, val as StepType)}
          >
            <Stack spacing="0.5rem">
              <Radio value="collect" colorScheme={checkboxColorScheme}>
                <Text textStyle="body-1" color="secondary.500">
                  Fill up a response
                </Text>
              </Radio>
              <Radio value="review" colorScheme={checkboxColorScheme}>
                <Text textStyle="body-1" color="secondary.500">
                  Fill up a response and approve
                </Text>
              </Radio>
            </Stack>
          </RadioGroup>
        </Box>

        <Divider />

        {/* Section: Step name */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
            Step name
          </Text>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNameBlur()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
          />
        </Box>

        <Divider />

        {/* Section: Respondent */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
            Respondent
          </Text>

          {step.order === 0 ? (
            <Flex align="center" gap="0.5rem">
              <Icon as={BiEnvelope} fontSize="1rem" color="secondary.400" />
              <Text textStyle="body-1" color="secondary.500">
                Anyone you share this form link with
              </Text>
            </Flex>
          ) : (
            <RadioGroup value={currentRespondentType}>
              <Stack spacing="0.75rem">
                <Box>
                  <Radio value="email_field" colorScheme={checkboxColorScheme}>
                    <Text textStyle="body-1" color="secondary.500">
                      Email field
                    </Text>
                  </Radio>
                  {currentRespondentType === 'email_field' && (
                    <MockSelect placeholder="Select an email field" />
                  )}
                </Box>

                <Box>
                  <Radio
                    value="specific_email"
                    colorScheme={checkboxColorScheme}
                  >
                    <Text textStyle="body-1" color="secondary.500">
                      Specific email(s)
                    </Text>
                  </Radio>
                  {currentRespondentType === 'specific_email' && (
                    <MockEmailTags
                      emails={stepRespondents
                        .filter((r) => r.email)
                        .map((r) => r.email!)}
                    />
                  )}
                </Box>

                <Box>
                  <Radio
                    value="dropdown_field"
                    colorScheme={checkboxColorScheme}
                  >
                    <Text textStyle="body-1" color="secondary.500">
                      Dropdown field
                    </Text>
                  </Radio>
                  {currentRespondentType === 'dropdown_field' && (
                    <MockSelect placeholder="Select a dropdown field" />
                  )}
                </Box>
              </Stack>
            </RadioGroup>
          )}
        </Box>

        <Divider />

        {/* Section: Fields in this step */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Flex justify="space-between" align="center" mb="0.75rem">
            <Text textStyle="subhead-1" color="secondary.500">
              Fields in this step
            </Text>
            <Text textStyle="body-2" color="secondary.400">
              {assignedCount} of {totalCount}
            </Text>
          </Flex>

          <Stack spacing="0.5rem">
            {fields.map((field) => {
              const isAssigned = step.fieldIds.includes(field.id)
              return (
                <Checkbox
                  key={field.id}
                  isChecked={isAssigned}
                  onChange={() => toggleFieldAssignment(step.id, field.id)}
                  colorScheme={checkboxColorScheme}
                  spacing="0.75rem"
                >
                  <Text textStyle="body-1" color="secondary.500">
                    {field.number}. {field.name}
                  </Text>
                </Checkbox>
              )
            })}
          </Stack>
        </Box>

        {/* Delete step (not for Step 1) */}
        {step.order > 0 && (
          <>
            <Divider />
            <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
              <Flex
                as="button"
                align="center"
                gap="0.5rem"
                cursor="pointer"
                onClick={() => removeStep(step.id)}
                _hover={{ opacity: 0.8 }}
              >
                <Icon as={BiTrash} fontSize="1rem" color="danger.500" />
                <Text textStyle="body-1" color="danger.500">
                  Delete step
                </Text>
              </Flex>
            </Box>
          </>
        )}
      </Box>
    </Flex>
  )
}
