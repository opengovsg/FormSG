import { useMemo } from 'react'
import { BiCalendar, BiCheck, BiChevronDown, BiStar, BiX } from 'react-icons/bi'
import { Box, Center, Checkbox, Flex, Icon, Text } from '@chakra-ui/react'

import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'

import { getStepColourThemes } from '../../types'
import {
  focusStateSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { StepPill } from './StepPill'

type FormFieldCardProps = {
  field: {
    _id: string
    title: string
    fieldType: string
    questionNumber?: number
  }
  fieldIndex: number
}

/**
 * Mock input that visually matches the real field type.
 * Uses the BasicField enum values from the API (e.g. 'textfield', 'textarea', 'dropdown').
 */
const MockInput = ({ fieldType }: { fieldType: string }): JSX.Element => {
  const baseBorder = {
    border: '1px solid',
    borderColor: 'neutral.400',
    borderRadius: '4px',
    bg: 'white',
    px: '1rem',
  }

  switch (fieldType) {
    // Single-line text inputs
    case 'textfield':
    case 'number':
    case 'decimal':
    case 'mobile':
    case 'homeno':
    case 'nric':
    case 'uen':
      return (
        <Box {...baseBorder} h="2.75rem" display="flex" alignItems="center">
          <Text textStyle="body-1" color="neutral.500">
            Type here...
          </Text>
        </Box>
      )

    case 'email':
      return (
        <Box {...baseBorder} h="2.75rem" display="flex" alignItems="center">
          <Text textStyle="body-1" color="neutral.500">
            e.g. name@example.com
          </Text>
        </Box>
      )

    // Long text
    case 'textarea':
      return (
        <Box {...baseBorder} h="5rem" pt="0.5rem">
          <Text textStyle="body-1" color="neutral.500">
            Type here...
          </Text>
        </Box>
      )

    // Dropdown and similar select fields
    case 'dropdown':
    case 'country_region':
      return (
        <Box
          {...baseBorder}
          h="2.75rem"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text textStyle="body-1" color="neutral.500">
            Select an option
          </Text>
          <Icon as={BiChevronDown} fontSize="1.25rem" color="secondary.400" />
        </Box>
      )

    // Radio and checkbox fields
    case 'radiobutton':
    case 'checkbox':
      return (
        <Box
          {...baseBorder}
          h="2.75rem"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text textStyle="body-1" color="neutral.500">
            Select an option
          </Text>
          <Icon as={BiChevronDown} fontSize="1.25rem" color="secondary.400" />
        </Box>
      )

    // Yes/No — toggle button style matching real form builder
    case 'yes_no':
      return (
        <Flex border="1px solid" borderColor="neutral.400" borderRadius="4px">
          <Flex
            flex={1}
            align="center"
            justify="center"
            gap="0.5rem"
            h="2.75rem"
            borderRight="1px solid"
            borderColor="neutral.400"
            cursor="default"
          >
            <Icon as={BiX} fontSize="1.25rem" color="secondary.500" />
            <Text textStyle="body-1" color="secondary.500">
              No
            </Text>
          </Flex>
          <Flex
            flex={1}
            align="center"
            justify="center"
            gap="0.5rem"
            h="2.75rem"
            cursor="default"
          >
            <Icon as={BiCheck} fontSize="1.25rem" color="secondary.500" />
            <Text textStyle="body-1" color="secondary.500">
              Yes
            </Text>
          </Flex>
        </Flex>
      )

    // Date
    case 'date':
      return (
        <Box
          {...baseBorder}
          h="2.75rem"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text textStyle="body-1" color="neutral.500">
            DD/MM/YYYY
          </Text>
          <Icon as={BiCalendar} fontSize="1rem" color="secondary.400" />
        </Box>
      )

    // Rating
    case 'rating':
      return (
        <Flex gap="0.25rem" pt="0.25rem">
          {[1, 2, 3, 4, 5].map((n) => (
            <Icon key={n} as={BiStar} fontSize="1.5rem" color="neutral.400" />
          ))}
        </Flex>
      )

    // Fallback for section, statement, attachment, image, table, etc.
    default:
      return (
        <Box {...baseBorder} h="2.75rem" display="flex" alignItems="center">
          <Text textStyle="body-1" color="neutral.500">
            ...
          </Text>
        </Box>
      )
  }
}

export const FormFieldCard = ({
  field,
  fieldIndex,
}: FormFieldCardProps): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const toggleFieldAssignment = useWorkflowBuilderStore(
    (s) => s.toggleFieldAssignment,
  )

  const colorTheme = useDesignColorTheme()

  const isStepEdit = focusState.type === 'step_edit'
  const activeStepId = isStepEdit ? focusState.stepId : null

  const activeStep = useMemo(
    () => (activeStepId ? steps.find((s) => s.id === activeStepId) : null),
    [activeStepId, steps],
  )

  const isAssignedToActiveStep = activeStep
    ? activeStep.fieldIds.includes(field._id)
    : false

  // Steps that include this field, sorted by order
  const assignedSteps = useMemo(
    () =>
      steps
        .filter((s) => s.fieldIds.includes(field._id))
        .sort((a, b) => a.order - b.order),
    [steps, field._id],
  )

  // Resolve colour themes
  const stepColourThemes = useMemo(
    () => getStepColourThemes(colorTheme),
    [colorTheme],
  )

  // Chakra colorScheme for the checkbox (maps FormColorTheme to theme-X)
  const checkboxColorScheme = colorTheme ? `theme-${colorTheme}` : 'theme-blue'

  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)

  const isFieldEdit =
    focusState.type === 'field_edit' && focusState.fieldId === field._id

  const handleCheckboxChange = () => {
    if (activeStepId) {
      toggleFieldAssignment(activeStepId, field._id)
    }
  }

  const handleFieldClick = () => {
    if (isStepEdit) {
      handleCheckboxChange()
    } else {
      setFocus({ type: 'field_edit', fieldId: field._id })
    }
  }

  const displayNumber = field.questionNumber ?? fieldIndex + 1

  return (
    <Flex py="0.375rem">
      {/* Pill zone - always full opacity */}
      <Flex
        w="32px"
        flexShrink={0}
        direction="column"
        align="center"
        justify="flex-start"
        pt="1.5rem"
        gap="2px"
      >
        {isStepEdit ? (
          <Checkbox
            isChecked={isAssignedToActiveStep}
            onChange={handleCheckboxChange}
            colorScheme={checkboxColorScheme}
            size="lg"
          />
        ) : (
          <>
            {assignedSteps.slice(0, 3).map((step) => (
              <StepPill
                key={step.id}
                colourTheme={
                  stepColourThemes[step.order % stepColourThemes.length]
                }
                stepNumber={step.order + 1}
              />
            ))}
            {assignedSteps.length > 3 && (
              <Center
                w="20px"
                h="20px"
                borderRadius="full"
                bg="neutral.300"
                flexShrink={0}
              >
                <Text fontSize="10px" color="secondary.500" lineHeight="1">
                  ...
                </Text>
              </Center>
            )}
          </>
        )}
      </Flex>

      {/* Field body - matches FieldRowContainer */}
      <Box
        flex={1}
        bg={isFieldEdit ? 'primary.100' : 'white'}
        borderRadius="4px"
        my="2px"
        opacity={isStepEdit && !isAssignedToActiveStep ? 0.4 : 1}
        _hover={
          isFieldEdit
            ? undefined
            : { bg: isStepEdit ? undefined : 'secondary.100' }
        }
        transition="background 0.2s ease, opacity 0.2s ease"
        cursor="pointer"
        onClick={handleFieldClick}
      >
        <Box
          px={{ base: '0.75rem', md: '1.5rem' }}
          pb={{ base: '0.75rem', md: '1.5rem' }}
          pt="1.5rem"
        >
          <Flex align="baseline">
            <Text
              as="span"
              textStyle="caption-1"
              color="secondary.700"
              mr="0.5rem"
              lineHeight={0}
            >
              {displayNumber}.
            </Text>
            <Text as="span" textStyle="subhead-1" color="secondary.700">
              {field.title}
            </Text>
          </Flex>
          <Box mt="0.75rem">
            <MockInput fieldType={field.fieldType} />
          </Box>
        </Box>
      </Box>
    </Flex>
  )
}
