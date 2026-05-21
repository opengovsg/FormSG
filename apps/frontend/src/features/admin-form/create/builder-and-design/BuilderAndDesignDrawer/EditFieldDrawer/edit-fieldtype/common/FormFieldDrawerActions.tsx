import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Divider, Stack, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { MultiSelect } from '~components/Dropdown'

import {
  stepsSelector,
  useWorkflowBuilderStore,
} from '~features/admin-form/create/workflow-v2/workflowBuilderStore'

import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from '../../../../useFieldBuilderStore'

interface FormFieldDrawerActionsProps {
  isLoading: boolean
  handleClick: ReturnType<UseFormHandleSubmit<FieldValues>>
  handleCancel: () => void
  buttonText: string
  isDisabled?: boolean
}

export const FormFieldDrawerActions = ({
  isLoading,
  handleClick,
  handleCancel,
  buttonText,
  isDisabled,
}: FormFieldDrawerActionsProps): JSX.Element => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  return (
    <Box>
      <WorkflowFieldAssignment />
      <Divider mx="-1.5rem" w="auto" />
      <Stack
        direction={{ base: 'column', md: 'row-reverse' }}
        justifyContent="end"
        w="100%"
        spacing={{ base: '0.5rem', md: '1rem' }}
        pt="1.5rem"
      >
        <Button
          isFullWidth={isMobile}
          isDisabled={isDisabled}
          isLoading={isLoading}
          onClick={handleClick}
        >
          {buttonText}
        </Button>
        <Button
          isDisabled={isLoading}
          isFullWidth={isMobile}
          variant="clear"
          colorScheme="secondary"
          onClick={handleCancel}
        >
          {t('features.common.cancel')}
        </Button>
      </Stack>
    </Box>
  )
}

/**
 * Multi-select dropdown for assigning the current field to workflow steps.
 * Renders during both field creation and editing when a workflow exists.
 * During creation, selections are stored locally and applied once the field
 * is saved and receives an _id from the backend.
 */
const WorkflowFieldAssignment = (): JSX.Element | null => {
  const stateData = useFieldBuilderStore(stateDataSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const assignField = useWorkflowBuilderStore((s) => s.assignField)
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)

  const fieldId = useMemo(() => {
    if (stateData.state === FieldBuilderState.EditingField) {
      return stateData.field._id
    }
    return undefined
  }, [stateData])

  const isCreating = stateData.state === FieldBuilderState.CreatingField
  const hasWorkflow = steps.length > 1

  // Pending step selections made during field creation (before _id exists)
  const [pendingStepIds, setPendingStepIds] = useState<string[]>([])
  const pendingRef = useRef<string[]>([])

  // When fieldId appears after creation, apply any pending assignments
  useEffect(() => {
    if (fieldId && pendingRef.current.length > 0) {
      for (const stepId of pendingRef.current) {
        assignField(stepId, fieldId)
      }
      pendingRef.current = []
      setPendingStepIds([])
    }
  }, [fieldId, assignField])

  // Reset pending state when entering creation mode
  useEffect(() => {
    if (isCreating) {
      setPendingStepIds([])
      pendingRef.current = []
    }
  }, [isCreating])

  const items = useMemo(
    () => steps.map((s) => ({ value: s.id, label: s.name })),
    [steps],
  )

  const selectedValues = useMemo(
    () =>
      fieldId
        ? steps.filter((s) => s.fieldIds.includes(fieldId)).map((s) => s.id)
        : pendingStepIds,
    [steps, fieldId, pendingStepIds],
  )

  const handleChange = useCallback(
    (values: string[]) => {
      if (!fieldId) {
        // During creation: store selections locally
        setPendingStepIds(values)
        pendingRef.current = values
        return
      }
      // During editing: apply immediately
      const prev = new Set(selectedValues)
      const next = new Set(values)
      for (const v of values) {
        if (!prev.has(v)) assignField(v, fieldId)
      }
      for (const v of selectedValues) {
        if (!next.has(v)) unassignField(v, fieldId)
      }
    },
    [selectedValues, assignField, unassignField, fieldId],
  )

  if (!hasWorkflow) return null

  return (
    <Box pb="2rem">
      <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
        Assign this field to a workflow step
      </Text>
      <MultiSelect
        name="workflowStepAssignment"
        items={items}
        values={selectedValues}
        onChange={handleChange}
        onBlur={() => {}}
        placeholder="Select a step from your workflow"
        isSelectedItemFullWidth
      />
    </Box>
  )
}
