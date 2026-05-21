import { useCallback } from 'react'
import { BiBox, BiLeftArrowAlt, BiLinkExternal } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  fieldsSelector,
  focusStateSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { FieldCard } from './FieldCard'

export const StepFocusFieldPanel = (): JSX.Element => {
  const { formId } = useParams()
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const assignField = useWorkflowBuilderStore((s) => s.assignField)
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)
  const assignApprovalField = useWorkflowBuilderStore(
    (s) => s.assignApprovalField,
  )
  const unassignApprovalField = useWorkflowBuilderStore(
    (s) => s.unassignApprovalField,
  )
  const assignAllFields = useWorkflowBuilderStore((s) => s.assignAllFields)
  const unassignAllFields = useWorkflowBuilderStore((s) => s.unassignAllFields)

  const stepId =
    focusState.type === 'step_focus' ? focusState.stepId : undefined
  const step = steps.find((s) => s.id === stepId)

  const handleBack = useCallback(() => {
    if (focusState.type === 'step_focus' && focusState.fromStepEdit && stepId) {
      setFocus({ type: 'step_edit', stepId, fromSummary: true })
    } else {
      setFocus({ type: 'phase', phase: 'assign_fields' })
    }
  }, [setFocus, focusState, stepId])

  if (!step) return <></>

  const isFirstStep = step.order === 0
  const isReviewStep = step.type === 'review'
  const truncatedName =
    step.name.length > 25 ? step.name.slice(0, 25) + '...' : step.name

  // Master checkbox state (Step 1 only)
  const allChecked =
    fields.length > 0 && fields.every((f) => step.fieldIds.includes(f.id))
  const isIndeterminate = step.fieldIds.length > 0 && !allChecked

  const handleMasterToggle = () => {
    if (!stepId) return
    if (allChecked) {
      unassignAllFields(stepId)
    } else {
      assignAllFields(stepId)
    }
  }

  const handleFieldToggle = (fieldId: string) => {
    if (!stepId) return
    if (step.fieldIds.includes(fieldId)) {
      unassignField(stepId, fieldId)
    } else {
      assignField(stepId, fieldId)
    }
  }

  const handleApprovalToggle = (fieldId: string) => {
    if (!stepId) return
    if (step.approvalFieldIds.includes(fieldId)) {
      unassignApprovalField(stepId, fieldId)
    } else {
      assignApprovalField(stepId, fieldId)
    }
  }

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
          aria-label="Back to assign fields"
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
          Assign fields for {truncatedName}
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        {/* Master checkbox for Step 1 */}
        {isFirstStep && fields.length > 0 && (
          <Flex
            align="center"
            gap="0.75rem"
            mb="1rem"
            cursor="pointer"
            onClick={handleMasterToggle}
          >
            <Checkbox
              isChecked={allChecked}
              isIndeterminate={isIndeterminate}
              onChange={handleMasterToggle}
              colorScheme="primary"
              onClick={(e) => e.stopPropagation()}
            />
            <Text textStyle="subhead-1" color="secondary.500">
              Assign all fields for first step
            </Text>
          </Flex>
        )}

        {/* Field checkboxes - single shared pool for all step types */}
        {/* Checking assigns to "Fields to fill". For review steps, drag to approval zone on canvas to reassign. */}
        <Stack spacing="0.5rem">
          {fields.map((f) => {
            const isInFill = step.fieldIds.includes(f.id)
            const isInApproval = step.approvalFieldIds.includes(f.id)
            const isChecked = isInFill || isInApproval
            return (
              <FieldCard
                key={f.id}
                field={f}
                showCheckbox
                isChecked={isChecked}
                onToggle={() => {
                  if (isChecked) {
                    // Uncheck: remove from whichever list it's in
                    if (isInFill) handleFieldToggle(f.id)
                    if (isInApproval) handleApprovalToggle(f.id)
                  } else {
                    // Check: default to "Fields to fill"
                    handleFieldToggle(f.id)
                  }
                }}
              />
            )
          })}
        </Stack>

        {isReviewStep && (
          <Text textStyle="body-2" color="secondary.400" mt="0.75rem">
            Drag a field to the approval drop zone on the canvas to assign it as
            an approval field.
          </Text>
        )}

        {fields.length === 0 && (
          <Flex
            direction="column"
            align="center"
            pt="2rem"
            pb="1rem"
            gap="0.5rem"
          >
            <Icon
              as={BiBox}
              fontSize="2rem"
              color="secondary.300"
              mb="0.25rem"
            />
            <Text
              textStyle="subhead-1"
              color="secondary.500"
              textAlign="center"
            >
              No fields yet
            </Text>
            <Button
              colorScheme="primary"
              rightIcon={<Icon as={BiLinkExternal} fontSize="0.875rem" />}
              onClick={() => {
                if (formId) {
                  window.open(`/admin/form/${formId}`, '_blank')
                }
              }}
            >
              Add new field in form builder
            </Button>
          </Flex>
        )}

        {/* CTA */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button variant="outline" colorScheme="primary" onClick={handleBack}>
            Done with this step
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
