import { useCallback, useMemo } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  chakra,
  Divider,
  Flex,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { MultiSelect } from '~components/Dropdown'
import InlineMessage from '~components/InlineMessage'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  fieldsSelector,
  focusStateSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

export const FieldAssignPanel = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const assignField = useWorkflowBuilderStore((s) => s.assignField)
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)
  const { formId } = useParams()

  const fieldId =
    focusState.type === 'field_assign' ? focusState.fieldId : undefined
  const field = fields.find((f) => f.id === fieldId)

  const handleBack = useCallback(() => {
    setFocus({ type: 'phase', phase: 'assign_fields' })
  }, [setFocus])

  // Step assignment MultiSelect
  const stepItems = useMemo(
    () => steps.map((s) => ({ value: s.id, label: s.name })),
    [steps],
  )

  const selectedStepIds = useMemo(
    () =>
      fieldId
        ? steps.filter((s) => s.fieldIds.includes(fieldId)).map((s) => s.id)
        : [],
    [steps, fieldId],
  )

  const handleStepChange = useCallback(
    (values: string[]) => {
      if (!fieldId) return
      const prev = new Set(selectedStepIds)
      const next = new Set(values)

      // Additions
      for (const v of values) {
        if (!prev.has(v)) {
          assignField(v, fieldId)
        }
      }

      // Removals
      for (const v of selectedStepIds) {
        if (!next.has(v)) {
          unassignField(v, fieldId)
        }
      }
    },
    [selectedStepIds, assignField, unassignField, fieldId],
  )

  if (!field || !fieldId) return <></>

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
          aria-label="Back to choose fields"
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
          Assign &ldquo;{field.number}. {field.name}&rdquo;
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Content */}
      <Flex
        flex={1}
        overflow="auto"
        px="1.5rem"
        pt="1rem"
        pb="1.5rem"
        flexDir="column"
      >
        {/* Info box */}
        <Box mb="1.5rem">
          <InlineMessage>
            {'To edit field settings, go to '}
            <chakra.span
              as="a"
              color="primary.500"
              cursor="pointer"
              textDecoration="underline"
              onClick={() => {
                if (formId) window.location.href = `/admin/form/${formId}`
              }}
            >
              form builder
            </chakra.span>
            .
          </InlineMessage>
        </Box>

        {/* Step assignment */}
        <Stack spacing="0.75rem">
          <Text textStyle="subhead-1" color="secondary.500">
            Assign to workflow steps
          </Text>
          <MultiSelect
            name="fieldStepAssignment"
            items={stepItems}
            values={selectedStepIds}
            onChange={handleStepChange}
            onBlur={() => {}}
            placeholder="Select steps from your workflow"
            isSelectedItemFullWidth
          />
        </Stack>

        {/* Footer */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button variant="outline" colorScheme="primary" onClick={handleBack}>
            Done editing
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
