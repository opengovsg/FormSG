import { useCallback, useMemo } from 'react'
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
 * Only renders when a workflow exists and the field is being edited.
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

  const hasWorkflow = steps.length > 1

  const items = useMemo(
    () => steps.map((s) => ({ value: s.id, label: s.name })),
    [steps],
  )

  const selectedValues = useMemo(
    () =>
      fieldId
        ? steps.filter((s) => s.fieldIds.includes(fieldId)).map((s) => s.id)
        : [],
    [steps, fieldId],
  )

  const handleChange = useCallback(
    (values: string[]) => {
      if (!fieldId) return
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

  if (!hasWorkflow || !fieldId) return null

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
