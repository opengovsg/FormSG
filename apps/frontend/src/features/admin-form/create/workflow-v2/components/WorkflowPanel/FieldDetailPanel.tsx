import { useCallback, useMemo } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import {
  Box,
  Checkbox,
  Divider,
  Flex,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'
import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import { STEP_COLOURS } from '../../types'
import {
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

type FieldDetailPanelProps = {
  fieldId: string
  fieldTitle: string
  fieldNumber: number
}

export const FieldDetailPanel = ({
  fieldId,
  fieldTitle,
  fieldNumber,
}: FieldDetailPanelProps): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const toggleFieldAssignment = useWorkflowBuilderStore(
    (s) => s.toggleFieldAssignment,
  )

  const colorTheme = useDesignColorTheme()
  const checkboxColorScheme = colorTheme ? `theme-${colorTheme}` : 'theme-blue'

  const assignedStepIds = useMemo(
    () =>
      new Set(
        steps.filter((s) => s.fieldIds.includes(fieldId)).map((s) => s.id),
      ),
    [steps, fieldId],
  )

  const handleBack = useCallback(() => {
    setFocus({ type: 'default' })
  }, [setFocus])

  return (
    <Flex h="100%" flexDir="column">
      {/* Sticky header - subflow pattern */}
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
          aria-label="Back to workflow"
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
          {fieldNumber}. {fieldTitle}
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto">
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
            Assign to steps
          </Text>
          <Text textStyle="caption-1" color="secondary.400" mb="1rem">
            Select which steps this field should appear in.
          </Text>

          <Stack spacing="0.5rem">
            {steps.map((step) => {
              const isAssigned = assignedStepIds.has(step.id)
              const stepColour = STEP_COLOURS[step.order % STEP_COLOURS.length]
              return (
                <Flex key={step.id} align="center" gap="0.75rem">
                  <Checkbox
                    isChecked={isAssigned}
                    onChange={() => toggleFieldAssignment(step.id, fieldId)}
                    colorScheme={checkboxColorScheme}
                    spacing="0.75rem"
                  >
                    <Flex align="center" gap="0.5rem">
                      <Flex
                        w="1.25rem"
                        h="1.25rem"
                        borderRadius="full"
                        bg={stepColour}
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <Text
                          fontSize="0.625rem"
                          fontWeight="700"
                          color="white"
                          lineHeight="1"
                        >
                          {step.order + 1}
                        </Text>
                      </Flex>
                      <Text textStyle="body-1" color="secondary.500">
                        {step.name}
                      </Text>
                    </Flex>
                  </Checkbox>
                </Flex>
              )
            })}
          </Stack>

          {steps.length === 0 && (
            <Text textStyle="body-2" color="secondary.400">
              No steps in this workflow yet.
            </Text>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Divider />
      <Flex justify="flex-end" gap="0.75rem" px="1.5rem" py="1rem" bg="white">
        <Button variant="clear" colorScheme="secondary" onClick={handleBack}>
          Cancel
        </Button>
        <Button colorScheme="primary" onClick={handleBack}>
          Done
        </Button>
      </Flex>
    </Flex>
  )
}
